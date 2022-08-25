// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

/// @title IERC1155 interface
/// @dev Used to call the necessary functions from the token address 
interface IERC1155Token is IERC1155 {
    function mint(address account, uint256 id, uint256 amount, bytes memory data) external;
    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) external;
}

/// @title Staking provider interface
/// @dev Used to call the functions from the staking provider 
interface IStakingProvider {
    function getStakingInfo() external returns (bytes32 name, bytes32 asset, uint256 apy);
    function stake() external payable;
    function withdraw() external;
}

contract Liquibet is Ownable { 

  struct Pool {
    AssetPair assetPair;
    uint256 startDateTime;
    uint256 lockPeriod;
    Tier[] tiers;
    StakingProvider stakingInfo;
    uint256 lowestPrice;
    uint256 creatorFee;
    bool exists;
  }

  struct Tier {
    uint256 buyInAmount;
    uint256 liquidationLevel;
  }

  struct StakingProvider {
    bytes32 name;
    address contractAddress;
    bytes32 asset;
    uint256 apy;
    uint amount;
  }

  struct AssetPair {
    bytes32 name;              // do we need name, can we get all the info from the chainlink contract?
    address priceFeedAddress;  // chainlink price feed data - is it in a form of a contract address?
  }

  uint256 fee;
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
    
    AssetPair memory assetPair = AssetPair(assetPairName, priceFeedAddress);

    // staking provider setup
    IStakingProvider stakingContract = IStakingProvider(stakingContractAddress);
    (bytes32 name, bytes32 asset, uint256 apy) = stakingContract.getStakingInfo();
    StakingProvider memory stakingProvider = StakingProvider(name, stakingContractAddress, asset, apy, 0);

    // tier levels hard-coded for now
    Tier memory tier1 = Tier(50, 7);
    Tier memory tier2 = Tier(100, 12);
    Tier memory tier3 = Tier(500, 17);
    Tier memory tier4 = Tier(1000, 25);
    Tier memory tier5 = Tier(5000, 35);

    // get the current price for the asset pair as the lowestPrice of the pool
    uint256 currentPrice = 20000; // TODO
    
    Pool memory pool = Pool(
      assetPair, 
      startDateTime, 
      lockPeriod, 
      new Tier[](5), 
      stakingProvider, 
      currentPrice, 
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
    token.mint(msg.sender, tierId, amount, "");

    // store pool ETH amount 
    pool.stakingInfo.amount += msg.value - fee;
    pool.creatorFee += fee;

    // emit TokenMinted()
  }

  function resolution(uint256 poolId) external {
    // check that lockin period ended
    // withdraw funds from staking contract
    // calculate the liqudations from price feed data:
      // liquidate the pool tiers whose liquidationLevel if higer than the lowest price of the pool
        // transfer the funds of lower tiers to the higher tiers
  }

  // stake pool funds in ETH
  function stakePoolFunds(uint256 poolId) external {
    // get the pool by id
    Pool memory pool = pools[poolId];
    // get the staking provider info from the pool
    IStakingProvider stakingProvider = IStakingProvider(pool.stakingInfo.contractAddress);
    // call the staking provider stake function
    stakingProvider.stake{ value: pool.stakingInfo.amount }();
  }

  // get the price data from chainlink price feed and store it
  function getPriceFeedData() private {
    // foreach active pool get the asset type
    for (uint256 i = 0; i < poolIds.length; i++) {
      Pool memory pool = pools[i];
      // get the price for the asset type from price feed
      // if the price is lower than the previous lowest price, store it
      // if (pool.lowestPrice > currentPrice) {
      //   pool.lowestPrice = currentPrice;
      // }
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