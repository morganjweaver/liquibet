import { ethers } from "ethers"; // Hardhat for testing
import "dotenv/config";
import * as SFTJson from "../artifacts/contracts/SFT.sol/SFT.json";
import {
  getSigner,
  checkBalance,
  convertStringArrayToBytes32,
} from "../helpers/utils";

async function main() {
  const signer = getSigner();

  if (!checkBalance(signer)) {
    return;
  }
  console.log("Deploying Ballot contract");
  const SFTFactory = new ethers.ContractFactory(
    SFTJson.abi,
    SFTJson.bytecode,
    signer
  );
  const SFTContract = await SFTFactory.deploy();
  console.log("Awaiting confirmations");
  await SFTContract.deployed();
  console.log("Completed");
  console.log(`SFT contract deployed at ${SFTContract.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
