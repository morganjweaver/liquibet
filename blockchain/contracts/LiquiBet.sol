// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title IERC1155 token interface
/// @dev Used to call the necessary functions from the token address 
interface IERC1155Token is IERC1155 {
    function mint(address account, uint256 id, uint256 amount, bytes memory data) external;
    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) external;
    function burn(uint256) external;
    function totalSupply(uint256 id) external returns (uint256);
    function exists(uint256 id) external returns (bool);
}

/// @title Staking provider interface
/// @dev Used to call the functions from the staking provider 
interface IStakingProvider {
    function getStakingInfo() external returns (bytes32 name, bytes32 asset, uint256 apy);
    function stake() external payable;
    function withdraw() external returns (uint256 amount);
}

contract Liquibet is AccessControl { 
  bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");

  struct Pool {
    uint256 poolId;
    AssetPair assetPair;
    uint256 startDateTime;
    uint256 lockPeriod;
    StakingInfo stakingInfo;
    uint256 creatorFee;
    uint256 totalPlayersCount;
    bool exists;
  }

  struct Tier {
    uint256 buyInAmount;
    uint256 liquidationPrice;
  }

  struct StakingInfo {
    bytes32 name;
    address contractAddress;
    bytes32 asset;
    uint256 apy;
    uint amountStaked;
  }

  struct AssetPair {
    bytes32 name;              // do we need name, can we get all the info from the chainlink contract?
    address priceFeedAddress;  // chainlink price feed data - is it in a form of a contract address?
    uint256 lowestPrice;
  }

  uint256 fee;  // fee should be large enough to cover contract operating expenses
  IERC1155Token public token;
  mapping(uint256 => Pool) pools;
  uint256[] poolIds;
  mapping(uint256 => Tier[]) tiers;    // poolId => tiers
  mapping(uint256 => mapping(uint256 => address[])) tierPlayers;    // poolId => (tierId => player addresses)
  mapping(uint256 => uint256) poolLiquidationPrizes;         // poolId => prize for each winning player
  mapping(uint256 => mapping(address => uint256)) poolLotteryWinners;     // poolId => mapping(playerAddres => amount)

  constructor(address _token, uint256 _fee) {
    token = IERC1155Token(_token);
    fee = _fee;
    
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  function createPool(
    uint256 startDateTime, 
    uint256 lockPeriod,
    bytes32 assetPairName,
    address priceFeedAddress,
    address stakingContractAddress,
    address keeperAddress
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {

    require(startDateTime > block.timestamp + 2 days, "Minimal buyin period is two days");
    require(assetPairName != "", "Asset pair name is required");
    require(priceFeedAddress != address(0), "Price feed address is required");
    require(stakingContractAddress != address(0), "Staking contract address is required");
    require(keeperAddress != address(0), "Keeper address is required");

    _grantRole(KEEPER_ROLE, keeperAddress);

    // get the current price for the asset pair as the lowestPrice of the pool
    uint256 currentPrice = 20000; // TODO    
    AssetPair memory assetPair = AssetPair(assetPairName, priceFeedAddress, currentPrice);

    // staking provider setup
    StakingInfo memory stakingInfo = setupStaking(stakingContractAddress);

    // pool setup
    Pool memory pool = Pool({
      poolId: poolIds.length,
      assetPair: assetPair, 
      startDateTime: startDateTime, 
      lockPeriod: lockPeriod, 
      stakingInfo: stakingInfo,
      creatorFee: 0,
      totalPlayersCount: 0,
      exists: true
    });

    uint256 newPoolId = poolIds.length;
    addNewPool(newPoolId, pool);
    
    // tier levels hard-coded for now
    tiers[newPoolId][0] = Tier(50, 7);
    tiers[newPoolId][1] = Tier(100, 12);
    tiers[newPoolId][2] = Tier(500, 17);
    tiers[newPoolId][3] = Tier(1000, 25);
    tiers[newPoolId][4] = Tier(5000, 35);

    // setup a keeper that calls the stakePoolFunds function with poolId on the pool startDateTime
    // setup a keeper that calls the resolution function with poolId on the end of the lockInPeriod
    // setup periodical keeper calls to update lowestPrice of the pools assets

    // emit PoolCreatedEvent
  }
  
  function buyIn(uint256 poolId, uint8 tierId, uint256 amount) external payable {
    
    require(amount > 0, "Mint amount must be larger than zero");
    // check if pool exists
    Pool storage pool = pools[poolId];
    require(pool.exists, "Pool is inactive");
    // check if buy-in period is still in effect
    require(block.timestamp <= pool.startDateTime, "Pool is locked");
    // check if tier exists
    require(tierId < tiers[poolId].length, "Tier doesn't exist in the given pool");
    // check msg.value >= necessary tier level amount for pool + fee
    require(msg.value >= amount * tiers[poolId][tierId].buyInAmount + fee, "Not enough funds for chosen tier level");

    // mint token based on pool and tier
    uint256 tokenId = getTokenId(poolId, tierId); // tokenId = poolId_tierId
    token.mint(msg.sender, tokenId, amount, "");

    // store pool ETH amount 
    pool.stakingInfo.amountStaked += msg.value - fee;
    pool.creatorFee += fee;

    tierPlayers[poolId][tierId].push(msg.sender);
    pool.totalPlayersCount++;

    // emit TokenMinted()
  }

  function resolution(uint256 poolId) external onlyRole(KEEPER_ROLE) {
    // check that lockin period ended
    Pool storage pool = pools[poolId];
    require(block.timestamp > pool.startDateTime + pool.lockPeriod, "Pool locking period is still in effect");
    
    // withdraw funds from staking contract
    IStakingProvider stakingProvider = IStakingProvider(pool.stakingInfo.contractAddress);
    uint256 totalAmount = stakingProvider.withdraw();

    // lottery
    uint256 lotteryPrize = safeSubtract(totalAmount, pool.stakingInfo.amountStaked);
    if (lotteryPrize > 0) {
      address winner = getLotteryWinner(poolId, pool.totalPlayersCount);
      if (winner != address(0)) {
        poolLotteryWinners[poolId][winner] = lotteryPrize;
      }
    }

    // liquidations
    poolLiquidationPrizes[poolId] = getLiquidationPrize(poolId, pool.assetPair.lowestPrice);

    // TODO if winningPlayersCount = 0 -> funds distributed to other pools and pool creator
  }

  // stake pool funds in ETH
  function stakePoolFunds(uint256 poolId) external onlyRole(KEEPER_ROLE) {
    // get the pool by id
    Pool memory pool = pools[poolId];
    // get the staking provider info from the pool
    IStakingProvider stakingProvider = IStakingProvider(pool.stakingInfo.contractAddress);
    // call the staking provider stake function
    stakingProvider.stake{ value: pool.stakingInfo.amountStaked }();
  }

  // get the price data from chainlink price feed and store it
  function getPriceFeedData() external onlyRole(KEEPER_ROLE) {
    // foreach active pool get the asset type
    for (uint256 i = 0; i < poolIds.length; i++) {
      Pool memory pool = pools[i];
      // get the price for the asset type from price feed
      // if the price is lower than the previous lowest price, store it
      // if (pool.assetPair.lowestPrice > currentPrice) {
      //   pool.assetPair.lowestPrice = currentPrice;
      // }
    }
  }
  
  function withdraw(uint256 tokenId) external {
    require(token.exists(tokenId), "Token with given id doesn't exist");

    uint poolId = getPoolId(tokenId);       
    uint tierId = getTierId(tokenId);       

    uint256 lotteryWinnings = poolLotteryWinners[poolId][msg.sender];

    Pool memory pool = pools[poolId];
    Tier memory tier = tiers[poolId][tierId];
    uint256 liquidationWinnings = isLiquidated(tier.liquidationPrice, pool.assetPair.lowestPrice) ? 0 : poolLiquidationPrizes[poolId];

    require(liquidationWinnings + lotteryWinnings > 0, "You have no winnings to withdraw");

    token.burn(tokenId);

    payable(msg.sender).transfer(liquidationWinnings + lotteryWinnings);
  }

  function getLotteryWinner(uint256 poolId, uint256 totalPlayersCount) private view returns (address winner) {
    
    address[] memory allPlayers = new address[](totalPlayersCount);
    uint256 arrIndex;
    for (uint8 i = 0; i < tiers[poolId].length; i++) {
      for (uint256 j = 0; j < tierPlayers[poolId][i].length; j++) { 
        allPlayers[arrIndex] = tierPlayers[poolId][i][j];
        arrIndex++;
      }
    }

    if (allPlayers.length > 0) {
        uint256 winnerIndex = getRandomNumber() % allPlayers.length;
        return allPlayers[winnerIndex];
    }

    return address(0);
  }

  function setupStaking(address stakingContractAddress) private returns (StakingInfo memory) {
    
    IStakingProvider stakingContract = IStakingProvider(stakingContractAddress);
    (bytes32 name, bytes32 asset, uint256 apy) = stakingContract.getStakingInfo();
    return StakingInfo(name, stakingContractAddress, asset, apy, 0);
  }

  function getLiquidationPrize(uint256 poolId, uint256 poolAssetLowestPrice) private returns (uint256) { 
    
    uint256 winningPlayersCount;
    uint256 totalLiquidatedFunds;
    
    for (uint8 i = 0; i < tiers[poolId].length; i++) {
      Tier memory tier = tiers[poolId][i];
      uint256 tokenId = getTokenId(poolId, i);

      if (isLiquidated(tier.liquidationPrice, poolAssetLowestPrice)) {
        uint256 tokenSupply = token.totalSupply(tokenId);
        winningPlayersCount += tokenSupply;
        totalLiquidatedFunds += tier.buyInAmount * tokenSupply;
      }
    }

    if (winningPlayersCount > 0) {
      return totalLiquidatedFunds / winningPlayersCount;
    }

    return 0;
  }

  function getRandomNumber() private view returns (uint256) {
      // TODO implement chainlink VRF
      return uint256(blockhash(block.number - 1));
  }

  function addNewPool(uint256 newPoolId, Pool memory pool) private {
    poolIds.push(newPoolId);
    pools[newPoolId] = pool;
  } 

  ///@dev tokeinId is formed from poolid and tokenId -> tokenId = poolId_tierId
  function getTokenId(uint256 poolId, uint8 tierId) private pure returns (uint256) {
    return poolId * 10 + tierId;
  }
  
  ///@dev poolId is tokenId with last digit removed
  function getPoolId(uint256 tokenId) private pure returns (uint256) {
    return tokenId / 10;
  }  

  ///@dev tierId is last digit in tokenId
  function getTierId(uint256 tokenId) private pure returns (uint256) {
    return tokenId % 10;
  }

  ///@notice liquidation threshold logic
  function isLiquidated(uint256 tierLiquidationPrice, uint256 assetLowestPrice) private pure returns (bool) {
    return tierLiquidationPrice < assetLowestPrice;
  }  

  ///@dev subtract without throwing error on negative overflow
  function safeSubtract(uint256 minuend, uint256 subtrahend) private pure returns(uint256) {
    return subtrahend > minuend ? 0 : minuend - subtrahend;
  }
}