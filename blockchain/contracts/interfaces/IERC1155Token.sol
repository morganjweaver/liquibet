// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

/// @title IERC1155 token interface
/// @dev Used to call the necessary functions from the token address 
interface IERC1155Token is IERC1155 {
    function mint(address to, uint256 id, uint256 amount, bytes memory data) external;
    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) external;
    function burn(address account, uint256 id, uint256 value) external;
    function totalSupply(uint256 id) external returns (uint256);
    function exists(uint256 id) external returns (bool);
}