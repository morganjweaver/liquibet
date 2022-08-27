import { ethers } from "ethers"; // Hardhat for testing
import "dotenv/config";
import * as Staking from "../artifacts/contracts/Staking.sol/Staking.json";
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
  if (process.argv.length < 3) throw new Error("Please input number of minutes for staking interval");
  const intervalInMinutes = process.argv[2];
  console.log("Deploying Staking contract");
  const StakingFactory = new ethers.ContractFactory(
    Staking.abi,
    Staking.bytecode,
    signer
  );
  const StakingContract = await StakingFactory.deploy(
    intervalInMinutes,
  );
  console.log("Awaiting confirmations");
  await StakingContract.deployed();
  console.log("Completed");
  console.log(`SFT contract deployed at ${StakingContract.address}`);
  console.log(`\n\n ***REMINDER: Please send a small amount of ETH to the contract for staking returns.***`)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
