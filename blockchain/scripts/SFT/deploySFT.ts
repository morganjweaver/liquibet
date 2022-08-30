import { ethers } from "ethers"; // Hardhat for testing
import "dotenv/config";
import * as SFTJson from "../../artifacts/contracts/SFT.sol/SFT.json";
import {
  getSigner,
  checkBalance,
} from "../../helpers/utils";

async function main() {
  const signer = getSigner();

  if (!checkBalance(signer)) {
    return;
  }
  console.log("Deploying SFT contract");
  const SFTFactory = new ethers.ContractFactory(
    SFTJson.abi,
    SFTJson.bytecode,
    signer
  );
  const SFTContract = await SFTFactory.deploy(
    60 * 60 * 24,
    "0xa39434a63a52e749f02807ae27335515ba4b07f7"
  );
  console.log("Awaiting confirmations");
  await SFTContract.deployed();
  console.log("Completed");
  console.log(`SFT contract deployed at ${SFTContract.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
