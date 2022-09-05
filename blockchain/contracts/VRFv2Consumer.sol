// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";

contract VRFv2Consumer is VRFConsumerBaseV2 {
  VRFCoordinatorV2Interface immutable COORDINATOR;
  LinkTokenInterface immutable LINKTOKEN;

  // Your subscription ID.
  uint64 immutable s_subscriptionId;

  // Goerli coordinator. For other networks,
  // see https://docs.chain.link/docs/vrf-contracts/#configurations
  // address vrfCoordinator = 0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D;

  // The gas lane to use, which specifies the maximum gas price to bump to.
  bytes32 immutable keyHash; // = 0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15;

  // Depends on the number of requested values that you want sent to the
  // fulfillRandomWords() function. Storing each word costs about 20,000 gas,
  // so 100,000 is a safe default for just a few words.
  uint32 immutable callbackGasLimit = 100000;

  // The default is 4, but you can set this higher.
  uint16 immutable requestConfirmations = 4;

  // For this example, retrieve 2 random values in one request.
  // Cannot exceed VRFCoordinatorV2.MAX_NUM_WORDS.
  uint32 immutable numWords =  2;

  uint256[] public s_randomWords;
  uint256 public s_requestId;
  address s_owner;

  constructor(
    uint64 _subscriptionId,
    address _vrfCoordinator,
    address _link,
    bytes32 _keyHash
  ) VRFConsumerBaseV2(_vrfCoordinator) {
    COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
    LINKTOKEN = LinkTokenInterface(_link);
    s_owner = msg.sender;
    s_subscriptionId = _subscriptionId;
    keyHash = _keyHash;
  }

  // Assumes the subscription is funded sufficiently.
  function requestRandomWords() external onlyOwner {
    // Will revert if subscription is not set and funded.
    s_requestId = COORDINATOR.requestRandomWords(
      keyHash,
      s_subscriptionId,
      requestConfirmations,
      callbackGasLimit,
      numWords
    );
  }

  function fulfillRandomWords(
    uint256, /* requestId */
    uint256[] memory randomWords
  ) internal override {
    s_randomWords = randomWords;
  }

  modifier onlyOwner() {
    require(msg.sender == s_owner);
    _;
  }
}
