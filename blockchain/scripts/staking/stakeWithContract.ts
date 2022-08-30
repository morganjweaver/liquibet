import { Contract, ethers } from "ethers"; // Hardhat for testing
import "dotenv/config";
import * as StakingJSON from "../../artifacts/contracts/Staking.sol/Staking.json";
import { Staking } from "../../typechain-types/contracts/Staking";
import {
  getSigner,
  checkBalance,
} from "../../helpers/utils";

async function main() {
  const signer = getSigner();

  if (!checkBalance(signer)) {
    return;
  }
  if (process.argv.length < 4) throw new Error("Please input staking contract address and deposit amount (don't forget leading zero as in 0.2)");
  const stakingAddress = process.argv[2];
  const depositAmount = process.argv[3].toString();

  console.log(`Attaching token contract interface to address ${stakingAddress}`);
  const stakingContract: Staking = new Contract(
    stakingAddress,
    StakingJSON.abi,
    signer
  ) as Staking;

  const tx = await stakingContract.stake({value: ethers.utils.parseEther(depositAmount)})
  console.log("Awaiting confirmations");
  await tx.wait();
  console.log(`Transaction completed. Hash: ${tx.hash}`);
  console.log(`Deposit tx completed at ${stakingContract.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});