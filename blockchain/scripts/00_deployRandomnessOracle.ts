import { ethers, Contract } from "ethers"; // Hardhat for testing
import "dotenv/config";
import * as VRFJSON from "../artifacts/contracts/VRFv2Consumer.sol/VRFv2Consumer.json";
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
  await VRFConsumer.requestRandomWords(); //load randomness
  console.log("Requested random words for lottery");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
