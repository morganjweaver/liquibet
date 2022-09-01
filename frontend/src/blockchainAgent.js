import LiquibetJSON from "./Liquibet.json";
import { environment } from "./environment";
import { ethers, utils } from 'ethers';
import { formatDateTime, formatPeriod } from "./helpers/dates";
import SFTJSON from "./SFT.json";
import { toast } from "react-toastify";
  
const provider = new ethers.providers.Web3Provider(window.ethereum);

async function getPoolData(poolId) {

  let contract = new ethers.Contract(
    environment.liquibetContractAddress,
    LiquibetJSON.abi,
    provider
  );

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
    startDateTime: formatDateTime(pool.startDateTime),
    lockPeriod: formatPeriod(pool.lockPeriod),
    stakingApy: utils.formatUnits(pool.stakingInfo.apy, 0),
    amountStaked: utils.formatEther(pool.stakingInfo.amountStaked),
    tiers: tiers
  };

  return item;
}


async function getMySFTs(poolId) {
  try {
    const signer = provider.getSigner();

    let contract = new ethers.Contract(
      environment.liquibetContractAddress,
      LiquibetJSON.abi,
      signer
    );

    const tokenAddress = await contract.token();
    let tokenContract = new ethers.Contract(
      tokenAddress,
      SFTJSON.abi,
      provider
    );
    const userAddress = await signer.getAddress();
    const amounts = [];
    for (let i = 10; i < 15; i++) {
      let amountTier = await tokenContract.balanceOf(userAddress, i);
      amounts.push(amountTier);
    }

    // TODO: get image urls from ipfs
    // const images = [];
    // for (let i = 0; i < 5; i++) {
    //   let metaData = await tokenContract.uri(i);
    //   let metaJson = await fetch(metaData)
    //     .then((res) => console.log(res))
    //     .then((out) => console.log("Checkout this JSON! ", out))
    //     .catch((err) => toast.error("Upload Error: " + err.message));
    //   console.log(metaJson);
    //   let imageSrc = metaJson.image;
    //   images.push(imageSrc);
    // }

    let item = {
      owner: userAddress,
      tokenAddress: tokenAddress,
      // tokenContract: tokenContract,
      amountsTier: amounts,
    };

    console.log(item);

    return item;
  } catch (e) {
    toast.error("Upload Error: " + e.message);
  }
}

export {
  getPoolData,
  getMySFTs
}