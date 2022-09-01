import LiquibetJSON from "./contracts/Liquibet.json";
import { environment } from "./environment";
import { ethers, utils } from 'ethers';
import { formatDateTime, formatPeriod, formatTimestamp } from "./helpers/dates";
import SFTJSON from "./contracts/SFT.json";
import { toast } from "react-toastify";
  
const provider = new ethers.providers.Web3Provider(window.ethereum);

function getLiquibetContract(signer) {
  return new ethers.Contract(
    environment.liquibetContractAddress,
    LiquibetJSON.abi,
    signer
  );
}

function getMockResolvedPool() {
  
  let pool = {
    asset: "ETHUSD",
    creatorFee: 0.0002,
    contractFee: 0.0001,
    startDateTime: formatDateTime(1661859600),
    lockPeriod: formatPeriod(129600),
    stakingApy: 7,
    amountStaked: 100,
    assetPair: {
      lowestPrice: 1222,
      referencePrice: 1438
    },
    isPoolResolved: true,
    tiers: [
      getTier("0.1", 10),
      getTier("0.2", 15),
      getTier("0.4", 25),
      getTier("0.7", 32),
      getTier("1", 40)
    ]
  };

  return pool;

  function getTier(buyInPrice, liquidationPrice) {
    return {
      buyInPrice: buyInPrice,
      liquidationPrice: liquidationPrice
    }
  }
}
async function getPoolData(poolId) {

  if (poolId == 2) {
    return getMockResolvedPool();
  }

  const contract = getLiquibetContract(provider);
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
    tiers: tiers,
    // isPoolResolved: Date.now() * 1000 > ethers.utils.formatUnits(pool.startDateTime, 0) + ethers.utils.formatUnits(pool.lockPeriod, 0)
    isPoolResolved: false,
  };

  return item;
}

function getMockPoolSfts() {
  let sfts = [
    {
      tokenId: 11,
      tierId: 1,
      amount: 1,
      imgSrc: "https://gateway.pinata.cloud/ipfs/QmdKf5YL2ppZ3wJ1sgyCfUffq8dewbCCcfDscCfkTWorKn",
      status: "Oh noes! R U DED? :("
    }
  ]
  return {
    sfts: sfts,
  }
}

async function getPoolSFTs(poolId) {
  try {
    if (poolId == 2) {
      return getMockPoolSfts();
    }

    const signer = provider.getSigner();

    let contract = getLiquibetContract(signer);

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
          amount: parseInt(utils.formatUnits(amountTier, 0)),
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

async function getSft(tokenId) {
  const signer = provider.getSigner();
  const userAddress = await signer.getAddress();
  
  const contract = getLiquibetContract(signer);
  const tokenAddress = await contract.token();

  let tokenContract = new ethers.Contract(
    tokenAddress,
    SFTJSON.abi,
    provider
  );
  
  let amountTier = await tokenContract.balanceOf(userAddress, tokenId);
  
  if (amountTier === 0) {
    throw Error("User has no tokens of givven tokenId");
  }

  let sftDetails = getSftDetails(tokenId);
  
  return {
    tokenId: tokenId,
    tierId: tokenId % 10,
    amount: parseInt(utils.formatUnits(amountTier, 0)),
    imgSrc: sftDetails.imgSrc,
    status: sftDetails.status
  };
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
  getSftDetails,
  getSft
}