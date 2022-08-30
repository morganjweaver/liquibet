import { ethers, Contract } from "ethers"; // Hardhat for testing
import "dotenv/config";
import * as LiquiBetJSON from "../artifacts/contracts/LiquiBet.sol/LiquiBet.json";
import {
  getSigner,
  checkBalance,
} from "../helpers/utils";

async function main() {
  const signer = getSigner();
  if (!checkBalance(signer)) {
    return;
  }
  if (process.argv.length < 4) throw new Error("Fee (in wei) or vrf contract address missing");
  const fee = process.argv[2];
  const vrfContractAddress = process.argv[3];
    
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
    vrfContractAddress,
    fee
  );

  console.log("Awaiting confirmation on LiquiBet deployment");
  await LiquiBetContract.deployed();
  console.log("Completed LiquiBet deployment");
  console.log(`LiquiBet contract deployed at ${LiquiBetContract.address}`);
  
  console.log(`Please register contract${LiquiBetContract.address} at https://keepers.chain.link/goerli as Custom Logic Upkeep`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
