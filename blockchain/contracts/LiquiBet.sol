// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

/// @title IERC1155 interface
/// @dev Used to call the necessary functions from the token address 
interface IERC1155Token is IERC1155 {
    function mint(address account, uint256 id, uint256 amount, bytes memory data) external;
    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) external;
    function burn(uint256) external;
}

/// @title Staking provider interface
/// @dev Used to call the functions from the staking provider 
interface IStakingProvider {
    function getStakingInfo() external returns (bytes32 name, bytes32 asset, uint256 apy);
    function stake() external payable;
    function withdraw() external returns (uint256 amount);
}

contract Liquibet is Ownable { 

  struct Pool {
    AssetPair assetPair;
    uint256 startDateTime;
    uint256 lockPeriod;
    Tier[] tiers;
    StakingProvider stakingInfo;
    uint256 creatorFee;
    uint256 totalPlayersCount;
    bool exists;
  }

  struct Tier {
    uint256 buyInAmount;
    uint256 liquidationPrice;
    address[] players;
  }

  struct StakingProvider {
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
  mapping(uint256 => Pool) public pools;
  uint256[] poolIds;
  mapping(uint256 => mapping(address => uint256)) poolLiquidationWinners; // poolId => mapping(playerAddres => amount)
  mapping(uint256 => mapping(address => uint256)) poolLotteryWinners;     // poolId => mapping(playerAddres => amount)

  constructor(address _token, uint256 _fee) {
    token = IERC1155Token(_token);
    fee = _fee;
  }

  function createPool(
    uint256 startDateTime, 
    uint256 lockPeriod,
    bytes32 assetPairName,
    address priceFeedAddress,
    address stakingContractAddress
    ) external onlyOwner {

    // get the current price for the asset pair as the lowestPrice of the pool
    uint256 currentPrice = 20000; // TODO    
    AssetPair memory assetPair = AssetPair(assetPairName, priceFeedAddress, currentPrice);

    // staking provider setup
    IStakingProvider stakingContract = IStakingProvider(stakingContractAddress);
    (bytes32 name, bytes32 asset, uint256 apy) = stakingContract.getStakingInfo();
    StakingProvider memory stakingProvider = StakingProvider(name, stakingContractAddress, asset, apy, 0);

    // tier levels hard-coded for now
    address[] memory emptyArr;
    Tier memory tier1 = Tier(50, 7, emptyArr);
    Tier memory tier2 = Tier(100, 12, emptyArr);
    Tier memory tier3 = Tier(500, 17, emptyArr);
    Tier memory tier4 = Tier(1000, 25, emptyArr);
    Tier memory tier5 = Tier(5000, 35, emptyArr);
    
    Pool memory pool = Pool(
      assetPair, 
      startDateTime, 
      lockPeriod, 
      new Tier[](5), 
      stakingProvider,
      0,
      0,
      true
    );
    
    pool.tiers[0] = tier1;
    pool.tiers[1] = tier2;
    pool.tiers[2] = tier3;
    pool.tiers[3] = tier4;
    pool.tiers[4] = tier5;

    // add the pool to the pools array / mapping
    addNewPool(poolIds.length, pool);

    // emit PoolCreatedEvent

    // setup a keeper that calls the stakePoolFunds function with poolId on the pool startDateTime

    // setup a keeper that calls the resolution function with poolId on the end of the lockInPeriod
  }
  
  function buyIn(uint256 poolId, uint8 tierId, uint256 amount) external payable {
    
    require(amount > 0, "Mint amount must be larger than zero");
    // check if pool and tier exist
    Pool storage pool = pools[poolId];
    require(pool.exists, "Pool is inactive");
    // check if buy-in period is still in effect
    require(block.timestamp <= pool.startDateTime, "Pool is locked");
    // check is tier exists
    require(tierId < pool.tiers.length, "Tier doesn't exist in the given pool");
    // check msg.value >= necessary tier level amount for pool + fee
    require(msg.value >= amount * pool.tiers[tierId].buyInAmount + fee, "Not enough funds for chosen tier level");

    // mint token based on tier level and assign it (or msg.sender address?) to the pool
    uint256 tokenId = poolId * 10 + tierId; // tokenId = poolId_tierId
    token.mint(msg.sender, tokenId, amount, "");

    // store pool ETH amount 
    pool.stakingInfo.amountStaked += msg.value - fee;
    pool.creatorFee += fee;

    pool.tiers[tierId].players.push(msg.sender);
    pool.totalPlayersCount++;

    // emit TokenMinted()
  }

  function resolution(uint256 poolId) external {
    // check that lockin period ended
    Pool storage pool = pools[poolId];
    require(block.timestamp > pool.startDateTime + pool.lockPeriod, "Pool locking period is still in effect");
    
    // withdraw funds from staking contract
    IStakingProvider stakingProvider = IStakingProvider(pool.stakingInfo.contractAddress);
    uint256 totalAmount = stakingProvider.withdraw();

    // lottery
    uint256 lotteryPrize = totalAmount - pool.stakingInfo.amountStaked;
    if (lotteryPrize > 0) {
      address winner = getLotteryWinner(pool);
      if (winner != address(0)) {
        poolLotteryWinners[poolId][winner] = lotteryPrize;
      }
    }

    // liquidations
    (uint256 winningPlayersCount, uint256 totalLiquidatedFunds) = getLiquidationData(pool);

    // TODO if winningPlayersCount = 0 -> funds distributed to other pools and pool creator
    
    if (winningPlayersCount > 0) {
      // distribute the funds of lower tiers to the higher tiers
      uint256 amountForEachWinner = totalLiquidatedFunds / winningPlayersCount;
      distributeFundsToLiquidationWinners(amountForEachWinner, poolId, pool);
    }
  }

  function withdraw(uint256 tokenId) external {
    uint poolId = tokenId % 10;       // tokenId = poolId_tierId
    uint256 liquidationWinnings = poolLiquidationWinners[poolId][msg.sender];
    uint256 lotteryWinnings = poolLotteryWinners[poolId][msg.sender];

    require(liquidationWinnings + lotteryWinnings > 0, "You have no winnings to withdraw");

    token.burn(tokenId);

    payable(msg.sender).transfer(liquidationWinnings + lotteryWinnings);
  }

  // stake pool funds in ETH
  function stakePoolFunds(uint256 poolId) external {
    // get the pool by id
    Pool memory pool = pools[poolId];
    // get the staking provider info from the pool
    IStakingProvider stakingProvider = IStakingProvider(pool.stakingInfo.contractAddress);
    // call the staking provider stake function
    stakingProvider.stake{ value: pool.stakingInfo.amountStaked }();
  }

  // get the price data from chainlink price feed and store it
  function getPriceFeedData() private {
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

  function getLotteryWinner(Pool storage pool) private view returns (address winner) {
    
    address[] memory allPlayers = new address[](pool.totalPlayersCount);
    uint256 arrIndex;
    for (uint8 i = 0; i < pool.tiers.length; i++) {
      Tier memory tier = pool.tiers[i];
      for (uint256 j = 0; j < tier.players.length; j++) { 
        allPlayers[arrIndex] = tier.players[j];
        arrIndex++;
      }
    }

    if (allPlayers.length > 0) {
        uint256 winnerIndex = getRandomNumber() % allPlayers.length;
        return allPlayers[winnerIndex];
    }

    return address(0);
  }

  function getLiquidationData(
    Pool storage pool
  ) 
    private 
    view
    returns (uint256 winningPlayersCount, uint256 totalLiquidatedFunds) { 
    
    for (uint8 i = 0; i < pool.tiers.length; i++) {
      Tier storage tier = pool.tiers[i];
      if (tier.liquidationPrice < pool.assetPair.lowestPrice) {
        winningPlayersCount += tier.players.length;
        totalLiquidatedFunds += tier.buyInAmount * tier.players.length;
      }
    }

    return (winningPlayersCount, totalLiquidatedFunds);
  }

  function distributeFundsToLiquidationWinners(
    uint256 amountForEachWinner, 
    uint256 poolId, 
    Pool storage pool
  ) 
    private {
    
      for (uint8 i = 0; i < pool.tiers.length; i++) {
        Tier storage tier = pool.tiers[i];
        if (tier.liquidationPrice < pool.assetPair.lowestPrice) {
          // TODO this could fail if we have unlimited number of players!
          for (uint256 j = 0; j < tier.players.length; j++) {
            poolLiquidationWinners[poolId][tier.players[j]] = amountForEachWinner; 
          }
        }
      }
  }

  function getRandomNumber() private view returns (uint256) {
      // TODO implement chainlink VRF
      return uint256(blockhash(block.number - 1));
  }

  function addNewPool(uint256 newPoolId, Pool memory pool) private {
    poolIds.push(newPoolId);
    pools[newPoolId] = pool;
  } 
}