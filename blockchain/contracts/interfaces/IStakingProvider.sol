// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/// @title Staking provider interface
/// @dev Used to call the functions from the staking provider 
interface IStakingProvider {
    function getStakingInfo() external returns (bytes32 name, bytes32 asset, uint256 apy);
    function stake() external payable;
    function withdraw() external returns (uint256 amount);
}