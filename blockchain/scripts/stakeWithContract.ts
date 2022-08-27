import { Contract, ethers } from "ethers"; // Hardhat for testing
import "dotenv/config";
import * as Staking from "../artifacts/contracts/Staking.sol/Staking.json";
import { Staking } from "../typechain-types/contracts/Staking";
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
  if (process.argv.length < 3) throw new Error("Please input staking contract address");
  const stakingAddress = process.argv[2];
  console.log(`Attaching token contract interface to address ${stakingAddress}`);
  const stakingContract = new Contract(
    stakingAddress,
    Staking.abi,
    signer
  ) as Staking;
  console.log("Awaiting confirmations");
  await StakingContract.deployed();
  console.log("Completed");
  console.log(`SFT contract deployed at ${StakingContract.address}`);
  console.log(`REMINDER: Please send a small amount of ETH to the contract for staking returns.`)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});