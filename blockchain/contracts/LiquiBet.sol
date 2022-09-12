// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IERC1155Token.sol";
import "./interfaces/IStakingProvider.sol";
import "./VRFv2Consumer.sol";
import "./SFT.sol";

///@title Liquibet gambling / lottery contract
contract Liquibet is AccessControl, KeeperCompatibleInterface { 

  struct Pool {
    uint256 poolId;
    AssetPair assetPair;
    uint256 startDateTime;
    uint256 lockPeriod;
    StakingInfo stakingInfo;
    uint256 creatorFee;
    uint256 totalPlayersCount;
    bool lockInExecuted;
    bool resolved;
  }

  struct Tier {
    uint256 buyInPrice;
    uint256 liquidationPrice;
  }

  //TODO do we need name, asset and apy? we can get it all from the staking contract address?
  struct StakingInfo {
    bytes32 name;
    address contractAddress;
    bytes32 asset;
    uint256 apy;   // TODO uint8
    uint256 amountStaked;
  }

  struct AssetPair {
    bytes32 name;              // do we need name, can we get all the info from the chainlink contract?
    address priceFeedAddress;  // chainlink price feed data - is it in a form of a contract address?
    uint256 lowestPrice;
    uint256 referencePrice;
  }

  VRFv2Consumer immutable VRFOracle; // randomness oracle
  SFT public immutable token;
  
  uint256 public fee;  // fee should be large enough to cover contract operating expenses
  mapping(uint256 => Pool) public pools;
  uint256[] public poolIds;
  uint256 lastPriceFeedUpdate;
  mapping(uint256 => Tier[]) public tiers;    // poolId => tiers
  mapping(uint256 => mapping(uint256 => address[])) public tierPlayers;    // poolId => (tierId => player addresses)
  mapping(uint256 => uint256) public poolLiquidationPrizes;         // poolId => prize for each winning player
  mapping(uint256 => mapping(address => uint256)) public poolLotteryWinners;     // poolId => mapping(playerAddres => amount)

  event PoolCreated(uint256 poolId, uint256 startDateTime, uint256 lockPeriod, bytes32 assetPairName);
  event TokenMinted(address to, bytes32 assetPairName, uint56 poolId, uint256 tier);

  constructor(
    uint256 _tokenUpdateInterval, 
    address _tokenPriceFeed, 
    address _VRFContract, 
    uint256 _fee
  ) {
    // TODO for now, liquibet contract deploys this default sft token
    // in the future, we should handle different price feeds for various assets 
    // solutions: deploy new token on create pool, have sft contract handle different price feeds etc.
    token = new SFT(_tokenUpdateInterval, _tokenPriceFeed);

    VRFOracle = VRFv2Consumer(_VRFContract);
    fee = _fee;
    lastPriceFeedUpdate = block.timestamp;

    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  receive() external payable {}

  function getPoolsCount() external view returns (uint256) {
    return poolIds.length;
  }
  
  ///@notice create a new pool
  ///@dev tier levels are hard-coded for now
  // TODO: pools should be separate SFT-implementing contracts.  Combine SFT with Pool info.
  // Needed so that the oracle passed in actually matches the asset they're tracking. 
  function createPool(
    uint256 startDateTime, 
    uint256 lockPeriod,
    bytes32 assetPairName,
    address priceFeedAddress,
    address stakingContractAddress
    ) external {

    // require(startDateTime > block.timestamp + 2 days, "Minimal buyin period is two days");
    require(assetPairName != "", "Asset pair name is required");
    require(priceFeedAddress != address(0), "Price feed address is required");
    require(stakingContractAddress != address(0), "Staking contract address is required");
    
    // get the current price for the asset pair as the lowestPrice of the pool
    uint256 currentPrice = getLatestPrice(priceFeedAddress);    
    AssetPair memory assetPair = AssetPair(assetPairName, priceFeedAddress, currentPrice, currentPrice);

    // staking provider setup
    StakingInfo memory stakingInfo = setupStaking(stakingContractAddress);

    // pool setup
    uint256 newPoolId = poolIds.length + 1;
    Pool memory pool = Pool({
      poolId: newPoolId,
      assetPair: assetPair, 
      startDateTime: startDateTime, 
      lockPeriod: lockPeriod, 
      stakingInfo: stakingInfo,
      creatorFee: 0,
      totalPlayersCount: 0,
      lockInExecuted: false,
      resolved: false
    });

    addNewPool(newPoolId, pool);
    
    // tier levels hard-coded for now
    tiers[newPoolId].push(Tier(3e16 wei, 7));     // 0.03 eth
    tiers[newPoolId].push(Tier(6e16 wei, 12));    // 0.06 eth
    tiers[newPoolId].push(Tier(30e16 wei, 19));   // 0.3 eth
    tiers[newPoolId].push(Tier(90e16 wei, 28));   // 0.9 eth
    tiers[newPoolId].push(Tier(300e16 wei, 38));  // 3 eth

    // setup a keeper that calls the stakePoolFunds function with poolId on the pool startDateTime
    // setup a keeper that calls the resolution function with poolId on the end of the lockInPeriod
    // setup periodical keeper calls to update lowestPrice of the pools assets

    emit PoolCreated(poolId, startDateTime, lockPeriod, assetPairName);
  }
  
  ///@notice buy a spot in a pool, mints a sft token for a caller
  function buyIn(uint256 poolId, uint8 tierId, uint256 amount) external payable {
    
    require(amount > 0, "Mint amount must be larger than zero");
    // check if pool exists
    Pool storage pool = pools[poolId];
    require(pool.startDateTime > 0, "Pool does not exist");
    // check if buy-in period is still in effect
    require(block.timestamp <= pool.startDateTime, "Pool buy-in period ended");
    // check if tier exists
    require(tierId < tiers[poolId].length, "Tier doesn't exist in the given pool");
    // check msg.value >= necessary tier level amount for pool + fee
    require(msg.value >= amount * tiers[poolId][tierId].buyInPrice + fee, "Not enough funds for chosen tier level");

    // store pool ETH amount 
    pool.stakingInfo.amountStaked += msg.value - fee;
    pool.creatorFee += fee;

    tierPlayers[poolId][tierId].push(msg.sender);
    pool.totalPlayersCount++;

    // mint token based on pool and tier
    uint256 tokenId = getTokenId(poolId, tierId); // tokenId = poolId_tierId
    token.mint(msg.sender, tokenId, amount, "");
    
    emit TokenMinted(msg.sender, pool.assetPair.name , pool.poolId, tierId);
  }

  ///@notice performs the contract resolution phase - withdraws staked funds, performs lottery and determines liqudation winners
  ///@dev if winningPlayersCount = 0 (all players got liquidated) case not handled
  function resolution(uint256 poolId) public onlyRole(DEFAULT_ADMIN_ROLE) {
    // check that lockin period ended
    Pool storage pool = pools[poolId];
    require(isPoolActive(pool.startDateTime, pool.lockPeriod), "Pool locking period is still in effect");
    
    // withdraw funds from staking contract
    IStakingProvider stakingProvider = IStakingProvider(pool.stakingInfo.contractAddress);
    uint256 totalAmount = stakingProvider.withdraw();

    // lottery
    uint256 lotteryPrize = safeSubtract(totalAmount, pool.stakingInfo.amountStaked);

    console.log(
      "amount staked: %s, amount from staking: %s, lottery prize: %s", 
      pool.stakingInfo.amountStaked, 
      totalAmount, 
      lotteryPrize
    );

    if (lotteryPrize > 0) {
      address winner = getLotteryWinner(poolId, pool.totalPlayersCount);
      
      console.log("lottery winner: %s", winner);

      if (winner != address(0)) {
        poolLotteryWinners[poolId][winner] = lotteryPrize;
      }
    }

    // liquidations
    poolLiquidationPrizes[poolId] = getLiquidationPrize(poolId, pool.assetPair.lowestPrice);
    
    pool.resolved = true;

    // TODO if winningPlayersCount = 0 -> funds distributed to other pools and pool creator
  }

  ///@notice stake pool funds
  ///@dev works only for ETH
  function stakePoolFunds(uint256 poolId) public onlyRole(DEFAULT_ADMIN_ROLE) {
    Pool memory pool = pools[poolId];
    IStakingProvider stakingProvider = IStakingProvider(pool.stakingInfo.contractAddress);
    stakingProvider.stake{ value: pool.stakingInfo.amountStaked }();
    // emit FundsStaked(poolId, pool.stakingInfo.asset, pool.stakingInfo.amountStaked)
  }

  ///@notice gets the price data from chainlink price feed
  ///@dev does not deal with asset decimals - TODO
  function getPriceFeedData() internal view {
    // foreach active pool get the asset type
    for (uint256 i = 0; i < poolIds.length; i++) {
      Pool memory pool = pools[i];
      
      if (isPoolInLockinPhase(pool.startDateTime, pool.lockPeriod)) {
        uint256 currentPrice = getLatestPrice(pool.assetPair.priceFeedAddress);
        if (pool.assetPair.lowestPrice > currentPrice) {
          pool.assetPair.lowestPrice = currentPrice;
        }
      }
    }
  }
  
  ///@notice withdraws funds from lottery and liquidation winnings and burns the sft
  ///@dev burns only 1 sft from a user - if user hase more sfts from the same pool they cannot be used to withdraw winnings again
  function withdraw(uint256 tokenId) external {
    require(token.exists(tokenId), "Token with given id doesn't exist");

    uint poolId = getPoolId(tokenId);       
    uint tierId = getTierId(tokenId);       

    uint256 lotteryWinnings = poolLotteryWinners[poolId][msg.sender];

    Pool memory pool = pools[poolId];
    Tier memory tier = tiers[poolId][tierId];
    uint256 liquidationWinnings = isLiquidated(tier.liquidationPrice, pool.assetPair.lowestPrice) ? 0 : poolLiquidationPrizes[poolId];

    console.log("liquidationWinnings: %s, lotteryWinnings: %s", liquidationWinnings, lotteryWinnings);
    require(liquidationWinnings + lotteryWinnings > 0, "You have no winnings to withdraw");

    poolLotteryWinners[poolId][msg.sender] = 0;
    token.burn(msg.sender, tokenId, 1);  // TODO find way to burn all the sfts of a user?

    payable(msg.sender).transfer(liquidationWinnings + lotteryWinnings);
  }

  ///@notice get s address of the lottery winner
  ///@dev if there is no winner (all the tiers got liquidated), returns zero address (address(0))
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

  function getLiquidationPrize(uint256 poolId, uint256 poolAssetLowestPrice) private view returns (uint256) { 
    
    uint256 winningPlayersCount;
    uint256 totalLiquidatedFunds;
    
    for (uint8 i = 0; i < tiers[poolId].length; i++) {
      Tier memory tier = tiers[poolId][i];
      uint256 tokenId = getTokenId(poolId, i);

      if (isLiquidated(tier.liquidationPrice, poolAssetLowestPrice)) {
        uint256 tokenSupply = token.totalSupply(tokenId);
        winningPlayersCount += tokenSupply;
        totalLiquidatedFunds += tier.buyInPrice * tokenSupply;
      }
    }

    if (winningPlayersCount > 0) {
      console.log("totalLiquidatedFunds: %s, winningPlayersCount: %s", totalLiquidatedFunds, winningPlayersCount);
      return totalLiquidatedFunds / winningPlayersCount;
    }

    return 0;
  }

  function getRandomNumber() private view returns (uint256) {
      return VRFOracle.s_randomWords(0);
  }

  ///@notice add new pool to storage
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
  
  function isPoolActive(uint256 startDateTime, uint256 lockPeriod) private view returns(bool) {
    return block.timestamp < startDateTime + lockPeriod;
  }
  
  function isPoolInLockinPhase(uint256 startDateTime, uint256 lockPeriod) private view returns(bool) {
    return block.timestamp > startDateTime && isPoolActive(startDateTime, lockPeriod);
  }

  ///@notice get the latest price from chainling price feed
  ///@dev if lastest price is negative (possible?) returns 0
  function getLatestPrice(address priceFeedAddress) private view returns (uint256) {
      AggregatorV3Interface pricefeed = AggregatorV3Interface(priceFeedAddress);
      (, int256 currentPrice, , , ) = pricefeed.latestRoundData();

      return currentPrice < 0 ? 0 : uint256(currentPrice);
  }

  /**
   * @notice Checks all pools to see which need upkeep.  Check happens on every mined block. 
   * @return upkeepNeeded signals if upkeep is needed for any of the pools
   */
  function checkUpkeep(bytes calldata)
    external
    view
    override
    returns (bool upkeepNeeded, bytes memory performData)
  {
    if(lastPriceFeedUpdate != 0 && block.timestamp + 6 hours > lastPriceFeedUpdate ){
      upkeepNeeded = true;
      performData = abi.encodePacked(uint256(0)); // This codes for the function to call in performUpkeep
      return (true, performData);
    }

    for (uint256 i = 0; i < poolIds.length; i++) {
      Pool memory pool = pools[i];
      //determine whether to initiate staking
      if (!pool.lockInExecuted && isPoolInLockinPhase(pool.startDateTime, pool.lockPeriod)) {
        upkeepNeeded = true;
        performData = abi.encodePacked(uint256(1)); 
        return (true, performData);
      }
      // determine whether to call resolution fx
      if (!pool.resolved && !isPoolActive(pool.startDateTime, pool.lockPeriod)) {
        upkeepNeeded = true;
        performData = abi.encodePacked(uint256(2)); 
        return (true, performData);
      }
    }

    upkeepNeeded = false;
    performData = abi.encodePacked(uint256(3));
    return (upkeepNeeded, performData);
  }

  /**
   * @notice Called by keeper to send funds to underfunded addresses
   * @param performData The abi encoded list of addresses to fund
   */
  function performUpkeep(bytes calldata performData) external override {
    uint256 decodedValue = abi.decode(performData, (uint256));
    if(decodedValue == 0){
      getPriceFeedData();
      lastPriceFeedUpdate = block.timestamp;
    } 
    if(decodedValue == 1){
      for (uint256 i = 0; i < poolIds.length; i++) {
        Pool storage pool = pools[i];
        if (!pool.lockInExecuted && isPoolInLockinPhase(pool.startDateTime, pool.lockPeriod)) {
          pool.assetPair.referencePrice = getLatestPrice(pool.assetPair.priceFeedAddress);
          stakePoolFunds(pool.poolId);
          pool.lockInExecuted = true;
        }
      }
    } 
    if(decodedValue == 2){
      for (uint256 i = 0; i < poolIds.length; i++) {
        Pool memory pool = pools[i];
        if (!pool.resolved && !isPoolActive(pool.startDateTime, pool.lockPeriod)) {
          resolution(pool.poolId);
        }
      } 
    }
  }
}