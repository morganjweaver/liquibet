import { Contract, ethers } from "ethers"; // Hardhat for testing
import "dotenv/config";
import * as StakingJSON from "../artifacts/contracts/Staking.sol/Staking.json";
import { Staking } from "../typechain-types/contracts/Staking";
import {
  getSigner,
  checkBalance,
} from "../helpers/utils";

// An administrative contract to withdraw all ETH back from teh contract.  Deployer only. 
async function main() {
  const signer = getSigner();

  if (!checkBalance(signer)) {
    return;
  }
  if (process.argv.length < 3) throw new Error("Please input staking contract address");
  const stakingAddress = process.argv[2];

  console.log(`Attaching token contract interface to address ${stakingAddress}`);
  const stakingContract: Staking = new Contract(
    stakingAddress,
    StakingJSON.abi,
    signer
  ) as Staking;

  const tx = await stakingContract.withdrawEntirety();
  console.log("Awaiting confirmations");
  await tx.wait();
  console.log(`Transaction completed. Hash: ${tx.hash}`);
  console.log(`Deposit tx completed at ${stakingContract.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});