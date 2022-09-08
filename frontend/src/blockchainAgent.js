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

function getTokenContract(tokenAddress) {
  return new ethers.Contract(
    tokenAddress,
    SFTJSON.abi,
    provider
  );
}

async function getPoolIds() {
  const contract = getLiquibetContract(provider);
  const count = await contract.getPoolsCount();
  return [...Array(count).keys()].map(i => i + 1);
}

async function getPools() {
  const contract = getLiquibetContract(provider);
  const count = await contract.getPoolsCount();

  const pools = []; 
  for (let poolId = 1; poolId <= count; poolId++) {
    pools.push(await getPoolData(poolId));
  }
  
  return pools;
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
    let tier = await contract.tiers(poolId, i);
    tiers.push(tier);
  }

  let item = {
    poolId: utils.formatUnits(pool.poolId, 0),
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

async function getPoolSFTs(poolId) {
  try {
    const signer = provider.getSigner();
    const contract = getLiquibetContract(signer);
    const tokenContract = getTokenContract(await contract.token());
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
    
    return sfts;

  } catch (e) {
    toast.error("Error: " + e.message);
  }
}

async function getSft(tokenId) {
  const signer = provider.getSigner();
  const userAddress = await signer.getAddress();
  
  const contract = getLiquibetContract(signer);
  const tokenContract = getTokenContract(await contract.token());
  
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
    };
  } else {
    
    return {
      id: 2,
      imgSrc: "https://gateway.pinata.cloud/ipfs/QmSoE4z3fqGunb9RWrLq9MzDE3qibJZoYgrPnfjCzdH748",
      poolId: 1,
      tierId: 2,
      poolStatus: "Closed",
      status: "Health Level 4, looking happy!"
    };
  }
}

async function buySFT(poolId, tierId, price) {
  let contract = getLiquibetContract(provider.getSigner());
  
  const salePrice = utils.parseEther(price);
  const feePrice = await contract.fee();
  const totalPrice = salePrice.add(feePrice);
  let transaction = await contract.buyIn(poolId, tierId, 1, {
    value: totalPrice,
  });
  await transaction.wait();
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
    };
  }
}

export {
  getPools,
  getPoolIds,
  getPoolData,
  getPoolSFTs,
  getSftDetails,
  getSft,
  buySFT
};