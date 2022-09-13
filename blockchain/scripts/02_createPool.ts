import { ethers, Contract } from "ethers"; // Hardhat for testing
import "dotenv/config";
import * as LiquiBetJSON from "../artifacts/contracts/LiquiBet.sol/LiquiBet.json";
import { Liquibet } from "../typechain-types";
import {
  getSigner,
  checkBalance,
} from "../helpers/utils";


// HOW TO USE:  yarn ts-node scripts/02_createPool.ts UNIX_EPOCH_START_DATE asset_pair_name_string staking_address liquibet_contract_address
let PRICE_FEEDS_GOERLI = new Map([
  ["BTCUSD", "0xa39434a63a52e749f02807ae27335515ba4b07f7"],
  ["ETHUSD", "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e"],
  ["LINKUSD", "0x48731cF7e84dc94C5f84577882c14Be11a5B7456"]
  ]);

async function main() {
  const signer = getSigner();
  if (!checkBalance(signer)) {
    return;
  }
  if (process.argv.length < 7) throw new Error("Fee (in wei) or vrf contract address or token name or UNIX epoch start date missing");
  if (!PRICE_FEEDS_GOERLI.has(process.argv[4])) throw new Error("Please input BTCUSD, LINKUSD or ETHUSD for asset type.");

  const startDateTime = process.argv[2]; 
  const lockPeriod = process.argv[3];
  const assetPairName = process.argv[4]; // "ETHUSD" or "BTCUSD" or "LINKUSD"
  const priceFeedAddress = PRICE_FEEDS_GOERLI.get(process.argv[4]);
  const stakingContractAddress = process.argv[5];   
  const liquibetContractAddress = process.argv[6];  
  
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
    priceFeedAddress!,
    stakingContractAddress
  );

  console.log(`Pool successfully created!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
