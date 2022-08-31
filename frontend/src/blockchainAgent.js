import LiquibetJSON from "./Liquibet.json";
import { environment } from "./environment";
import { ethers, utils } from 'ethers';
import { formatDateTime, formatPeriod } from "./helpers/dates";
  
const provider = new ethers.providers.Web3Provider(window.ethereum);

let contract = new ethers.Contract(
  environment.liquibetContractAddress,
  LiquibetJSON.abi,
  provider
);

async function getPoolData(poolId) {

  const pool = await contract.pools(poolId);
  const fee = await contract.fee();

  let tiersCount = 5;
  let tiers = [];
  for(let i = 0; i < tiersCount; i++) {
    let tier = await contract.tiers(1, i);
    tiers.push(tier);
  }

  let item = {
    asset: utils.parseBytes32String(pool.assetPair.name),
    creatorFee: utils.formatEther(pool.creatorFee),
    contractFee: utils.formatEther(fee),
    startDate: formatDateTime(pool.startDateTime),
    lockPeriod: formatPeriod(pool.lockPeriod),
    tiers: tiers
  };
}

export {
  getPoolData
}