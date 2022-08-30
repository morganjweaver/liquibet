import { ethers, Contract } from "ethers"; // Hardhat for testing
import "dotenv/config";
import * as LiquiBetJSON from "../artifacts/contracts/LiquiBet.sol/LiquiBet.json";
import * as VRFJSON from "../artifacts/contracts/VRFOracle.sol/VRFv2Consumer.json";
import { VRFv2Consumer } from "../typechain-types";
import {
  getSigner,
  checkBalance,
} from "../helpers/utils";

async function main() {
  const signer = getSigner();
  if (!checkBalance(signer)) {
    return;
  }
  if (process.argv.length < 3) throw new Error("Fee (in wei) missing");
  const fee = process.argv[2];
  
  // First deploy randomness oracle
  console.log("Deploying Randomness contract");
  const VRFFactory = new ethers.ContractFactory(
    VRFJSON.abi,
    VRFJSON.bytecode,
    signer
  );
  const VRFContract = await VRFFactory.deploy(
   process.env.VRF_SUBSCRIPTION_ID
  );
  console.log("Awaiting confirmation on VRF Oracle deployment");
  await VRFContract.deployed();
  console.log("Completed VRF Oracle deployment");
  console.log(`VRF Oracle contract deployed at ${VRFContract.address}`);
  
  console.log("Deploying VRF Consumer contract");
  const VRFConsumer: VRFv2Consumer = new Contract(
    VRFContract.address,
    VRFJSON.abi,
    signer
  ) as VRFv2Consumer;
  VRFConsumer.requestRandomWords(); //load randomness
  console.log("Requested random words for lottery");
  
  // Now deploy LiquiBet 
  console.log("Deploying LiquiBet contract");
  const LiquiBetFactory = new ethers.ContractFactory(
    LiquiBetJSON.abi,
    LiquiBetJSON.bytecode,
    signer
  );

  const tokenUpdateInterval = 60 * 60 * 24;
  const priceFeedAddress = "0xa39434a63a52e749f02807ae27335515ba4b07f7";
  const LiquiBetContract = await LiquiBetFactory.deploy(
    tokenUpdateInterval,
    priceFeedAddress,
    VRFContract.address,
    fee
  );

  console.log("Awaiting confirmation on LiquiBet deployment");
  await LiquiBetContract.deployed();
  console.log("Completed LiquiBet deployment");
  console.log(`LiquiBet contract deployed at ${LiquiBetContract.address}`);

  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
