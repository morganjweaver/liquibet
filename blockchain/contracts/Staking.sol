// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";


contract Staking is KeeperCompatibleInterface {

    address payable public admin;
    uint256 interest_percent = 10;
    // Example: 26 * 24 * 60 for 26-day staking period * 24 hrs/day * 60 min/hr
    uint stakingIntervalInMinutes; 
    
    struct StakingDetails {
        uint when;
        uint256 amountDeposited;
    }

    address[] stakingAddresses;
    mapping(address => StakingDetails) stakingCustomers;

    event Deposit(uint amount, uint when);
    event Withdrawal(uint amount, uint when);

    constructor(uint stakingIntervalMinutes) {
        admin = payable(msg.sender);
        stakingIntervalInMinutes = stakingIntervalMinutes;
    }

    modifier onlyOwner() {
        require(msg.sender == admin, 'Not owner');
        _;
    }

    function stake() public payable {
        stakingCustomers[msg.sender] = StakingDetails(block.timestamp, msg.value);
        emit Deposit(msg.value, block.timestamp);
    }

    // For testing/dev/demo purposes
    function withdraw() public onlyOwner {
        require(stakingCustomers[msg.sender].when != 0, "Customer has no funds staked");
        uint256 returnAmount = stakingCustomers[msg.sender].amountDeposited * interest_percent + 100 / 100;
        require(address(this).balance > returnAmount, 
        "Staking contract has insufficient funds for repayment!");
        (bool result, bytes memory returnData) = (msg.sender).call{
            value: returnAmount}("");
        require(result == true, "Failure to withdraw ether");
    }

    // For Chainlink Keeper to call
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
            passed = (currentTimestamp = stakingCustomers[stakingAddresses[i]].when) / 60;
            if (passed >= stakingIntervalInMinutes){
                // Defaults to 0/false, I think?  Only need to set if true?
                upkeepNeeded = true;
            }
        }
    }
    
    // Checks the interval of each staking address and sends back to staker if 26 days (in Minutes) has elapsed
    function performUpkeep(bytes calldata /* performData */) external override {
        uint currentTimestamp = block.timestamp;
        for (uint256 i = 0; i < stakingAddresses.length; i++ ) {
            uint passed = (currentTimestamp = stakingCustomers[stakingAddresses[i]].when) / 60;
            if (passed >= stakingIntervalInMinutes){
                returnDepositWithInterest(stakingAddresses[i]);
            }
        }

    }

    receive() external payable {}


}