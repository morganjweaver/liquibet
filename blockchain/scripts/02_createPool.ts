import { ethers, Contract } from "ethers"; // Hardhat for testing
import "dotenv/config";
import * as LiquiBetJSON from "../artifacts/contracts/LiquiBet.sol/LiquiBet.json";
import { Liquibet } from "../typechain-types";
import {
  getSigner,
  checkBalance,
} from "../helpers/utils";

async function main() {
  const signer = getSigner();
  if (!checkBalance(signer)) {
    return;
  }
  if (process.argv.length < 8) throw new Error("Fee (in wei) or vrf contract address missing");

  const startDateTime = process.argv[2]; 
  const lockPeriod = process.argv[3];
  const assetPairName = process.argv[4];
  const priceFeedAddress = process.argv[5];
  const stakingContractAddress = process.argv[6];   
  const liquibetContractAddress = process.argv[7];  
  
  console.log("Attaching LiquiBet contract");
  const LiquiBetFactory = new ethers.ContractFactory(
    LiquiBetJSON.abi,
    LiquiBetJSON.bytecode,
    signer
  );

  const liquibetContract = LiquiBetFactory.attach(liquibetContractAddress) as Liquibet;
  
  console.log("Creating new pool");
  await liquibetContract.createPool(
    startDateTime,
    lockPeriod,
    ethers.utils.formatBytes32String(assetPairName),
    priceFeedAddress,
    stakingContractAddress
  );

  console.log(`Pool successfully created!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
