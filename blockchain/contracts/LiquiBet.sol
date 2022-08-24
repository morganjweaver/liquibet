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
    function stake(uint256 amount) external;
    function withdraw() external;
}

contract Liquibet is Ownable { 

  struct Pool {
    AssetPair assetPair;
    uint256 startDateTime;
    uint256 lockPeriod;
    Tier[] tiers;
    StakingProvider stakingInfo;
    mapping(address => uint256) liquidationWinners;
    mapping(address => uint256) lotteryWinners;
    uint256 lowestPrice;
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
  }

  struct AssetPair {
    bytes32 name;              // do we need name, can we get all the info from the chainlink contract?
    address priceFeedAddress;  // chainlink price feed data - is it in a form of a contract address?
  }

  uint256 fee;
  IERC1155Token public token;
  mapping(uint256 => Pool) public pools;
  uint256[] poolIds;

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
    StakingProvider memory stakingProvider = StakingProvider(name, stakingContractAddress, asset, apy);

    // tier levels hard-coded for now
    Tier memory tier1 = Tier(50, 7);
    Tier memory tier2 = Tier(100, 12);
    Tier memory tier3 = Tier(500, 17);
    Tier memory tier4 = Tier(1000, 25);
    Tier memory tier5 = Tier(5000, 35);

    // get the current price for the asset pair as the lowestPrice of the pool
    uint256 lowestPrice = 20000; // TODO
    // TODO initialize struct mappings
    Pool memory pool = Pool(assetPair, startDateTime, lockPeriod, new Tier[](5), stakingProvider, , , lowestPrice);
    
    pool.tiers[0] = tier1;
    pool.tiers[1] = tier2;
    pool.tiers[2] = tier3;
    pool.tiers[3] = tier4;
    pool.tiers[4] = tier5;

    // add the pool to the pools array / mapping

    // setup a keeper that calls the stakePoolFunds function with poolId on the pool startDateTime

    // setup a keeper that calls the resolution function with poolId on the end of the lockinPeriod
  }
  
  function buyIn(uint256 poolId, uint8 tier) external payable {
    // check if pool and tier exist
    // check if buy-in period is still in effect
    // check msg.value >= necessary tier level amount for pool + fee 
    // mint token based on tier level and assign it (or msg.sender address?) to the pool
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
    // get the staking provider info from the pool
    // call the staking provider stake function
  }

  // get the price data from chainlink price feed and store it
  function getPriceFeedData() private {
    // get all the pools
      // foreach pool get the asset type
      // the the price for the asset type from price feed
      // if the price is lower than the previous lowest price, store it
  }

  function getRandomNumber() private view returns (uint256) {
      // TODO implement chainlink VRF
      return uint256(blockhash(block.number - 1));
  }
}