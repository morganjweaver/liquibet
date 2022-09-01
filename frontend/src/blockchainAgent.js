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


async function getPoolSFTs(poolId) {
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
    const sfts = [];

    for (let i = 0; i < 5; i++) {
      let tokenId = poolId * 10 + i;
      let amountTier = await tokenContract.balanceOf(userAddress, tokenId);
      if (amountTier > 0) {
        let sftDetails = getSftDetails(tokenId);
        sfts.push({
          tokenId: tokenId,
          tierId: i,
          amount: amountTier,
          imgSrc: sftDetails.imgSrc,
          status: sftDetails.status
        });
      }
    }

    let item = {
      owner: userAddress,
      tokenAddress: tokenAddress,
      // tokenContract: tokenContract,
      sfts: sfts,
    };

    console.log(item);

    return item;
  } catch (e) {
    toast.error("Error: " + e.message);
  }
}

function getSftDetails(tokenId) {
  
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

  if (tokenId == 11) {
    return {
      id: 1,
      imgSrc: "https://gateway.pinata.cloud/ipfs/QmRf7fdqC5WVryZmfXH5PnHXs4SUzPfQ3RUrpwfDSvzTAa",
      poolId: 1,
      tierId: 1,
      poolStatus: "Open",
      status: "Health Level 3, OK!"
    }
  } else {
    
    return {
      id: 2,
      imgSrc: "https://gateway.pinata.cloud/ipfs/QmSoE4z3fqGunb9RWrLq9MzDE3qibJZoYgrPnfjCzdH748",
      poolId: 1,
      tierId: 2,
      poolStatus: "Closed",
      status: "Health Level 4, looking happy!"
    }
  }
}

export {
  getPoolData,
  getPoolSFTs,
  getSftDetails
}