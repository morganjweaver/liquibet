// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";


contract Staking is KeeperCompatibleInterface {

    address payable public admin;
    uint256 interest_percent = 10;
    uint stakingIntervalInHours = 26 * 24; // 26-day staking period * 24 hrs/day

    struct StakingDetails {
        uint when;
        uint256 amountDeposited;
    }
    address[] stakingAddresses;
    mapping(address => StakingDetails) stakingCustomers;

    event Deposit(uint amount, uint when);
    event Withdrawal(uint amount, uint when);

    constructor() {
        admin = payable(msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == admin, 'Not owner');
        _;
    }

    function stake() public payable {
        stakingCustomers[msg.sender] = StakingDetails(block.timestamp, msg.value);
        emit Deposit(msg.value, block.timestamp);
    }

    function withdraw() public {
        require(stakingCustomers[msg.sender].when != 0, "Customer has no funds staked");
        uint256 returnAmount = stakingCustomers[msg.sender].amountDeposited * interest_percent + 100 / 100;
        require(address(this).balance > returnAmount, 
        "Staking contract has insufficient funds for repayment!");
        
        (bool result, bytes memory returnData) = (msg.sender).call{
            value: returnAmount}("");
        require(result == true, "Failure to withdraw ether");
    }

    function returnDepositWithInterest(address staker) internal {
        require(stakingCustomers[staker].when != 0, "Customer has no funds staked");
        uint256 returnAmount = stakingCustomers[staker].amountDeposited * interest_percent + 100 / 100;
        require(address(this).balance > returnAmount, 
        "Staking contract has insufficient funds for repayment!");
        
        (bool result, bytes memory returnData) = (staker).call{
            value: returnAmount}("");
        require(result == true, "Failure to withdraw ether");
    }

    // administrative function as deployer must deploy with a small amount of ETH
    function withdrawEntirety() public onlyOwner {
        (bool result, bytes memory returnData) = admin.call{value: address(this).balance}("");
        require(result == true, "Failure to withdraw ether; contract may be ");

    }

    // Checks if any of the contracts have matured and are ready to be cashed out
    function checkUpkeep(bytes calldata /* checkData */) external view override returns (bool upkeepNeeded, bytes memory /* performData */) {
        uint passed;
        uint currentTimestamp = block.timestamp;
        for (uint256 i = 0; i < stakingAddresses.length; i++ ) {
            passed = (currentTimestamp = stakingCustomers[stakingAddresses[i]].when) / 60 / 60;
            if (passed >= stakingIntervalInHours){
                upkeepNeeded = true;
            }
        }
        upkeepNeeded = false;
    }
    
    // Checks the interval of each staking address and sends back to staker if 26 days (in hours) has elapsed
    function performUpkeep(bytes calldata /* performData */) external override {
        uint currentTimestamp = block.timestamp;
        for (uint256 i = 0; i < stakingAddresses.length; i++ ) {
            uint passed = (currentTimestamp = stakingCustomers[stakingAddresses[i]].when) / 60 / 60;
            if (passed >= stakingIntervalInHours){
                returnDepositWithInterest(stakingAddresses[i]);
            }
        }

    }


}