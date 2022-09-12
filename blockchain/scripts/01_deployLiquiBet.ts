import { ethers, Contract } from "ethers"; // Hardhat for testing
import "dotenv/config";
import * as LiquiBetJSON from "../artifacts/contracts/LiquiBet.sol/LiquiBet.json";
import {
  getSigner,
  checkBalance,
} from "../helpers/utils";
import { Liquibet } from "../typechain-types";

// deploy with args ETH fee extracted from each buy-in (suggest no more than 10-20% of lowest buy-in or .001 )
async function main() {
  const signer = getSigner();
  if (!checkBalance(signer)) {
    return;
  }
  if (process.argv.length < 4) throw new Error("Fee (in ETH) or vrf contract address missing");
  const fee = ethers.utils.parseEther(process.argv[2].toString());
  const vrfContractAddress = process.argv[3];
    
  // Now deploy LiquiBet 
  console.log("Deploying LiquiBet contract");
  const LiquiBetFactory = new ethers.ContractFactory(
    LiquiBetJSON.abi,
    LiquiBetJSON.bytecode,
    signer
  );

  const tokenUpdateInterval = 60 * 60 * 24;
  // ETHUSD Feed; FIX IN FUTURE--allow variable oracles to match SFT contract when we 
  // refactor with Pools inheriting the SFT type vs one SFT to service all tokens (bad)
  const priceFeedAddress = "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e";
  const LiquiBetContract = await LiquiBetFactory.deploy(
    tokenUpdateInterval,
    priceFeedAddress,
    vrfContractAddress,
    fee
  ) as Liquibet;

  console.log("Awaiting confirmation on LiquiBet deployment");
  await LiquiBetContract.deployed();
  console.log("Completed LiquiBet deployment");
  console.log(`LiquiBet contract deployed at ${LiquiBetContract.address}`);
  const tokenAddress = await LiquiBetContract.token();
  console.log(`Please register contracts ${LiquiBetContract.address} (main) and associated SFT contract ${tokenAddress} at https://keepers.chain.link/goerli as Custom Logic Upkeep`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
