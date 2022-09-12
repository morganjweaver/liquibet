import { ethers } from "ethers"; // Hardhat for testing
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
  if (process.argv.length < 4) throw new Error("Pool id or liquibet contract address are missing");

  const poolId = process.argv[2]; 
  const liquibetContractAddress = process.argv[3];  
  
  console.log("Attaching LiquiBet contract");
  const LiquiBetFactory = new ethers.ContractFactory(
    LiquiBetJSON.abi,
    LiquiBetJSON.bytecode,
    signer
  );

  const liquibetContract = LiquiBetFactory.attach(liquibetContractAddress) as Liquibet;
  
  console.log("Creating new pool");
  await liquibetContract.resolution(
    poolId
  );

  console.log(`Pool successfully created!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
