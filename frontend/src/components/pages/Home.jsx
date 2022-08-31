import React from "react";
import LiquibetJSON from "../../Liquibet.json";
import { useState } from "react";
import { environment } from "../../environment";
import { toast } from 'react-toastify';
import { ethers, utils } from 'ethers';
import { formatDateTime, formatPeriod } from "../../helpers/dates";
import SmallPoolCard from "../shared/SmallPoolCard";

function Home() {

  const [dataFetched, updateDataFetched] = useState(false);
  const [data, updateData] = useState({});
  
  const poolId = 1;
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  
  let contract = new ethers.Contract(
    environment.liquibetContractAddress,
    LiquibetJSON.abi,
    provider
  );
  
  async function getPoolData() {
  
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
      tiers: tiers
    };
    
    console.log(item);
    updateData(item);
    updateDataFetched(true);
  }
  
  if (!dataFetched) getPoolData();

  return (
    <div className="">
      <h1 className="text-4xl font-1 font-bold font-size-headline color-1 mt-8">LIQUIBET</h1>
      <h2 className="mt-8 text-4xl text-white font-1 font-bold font-size-headline">
        Buy, bet, and don't get liquidated!
      </h2>
      <p className="mt-8 text-white font-1">
        A dynamic SFT Asset Derivative with Gambling and Lottery Mechanics
      </p>
      <div className="text-center">
        <SmallPoolCard poolId={1} 
                      startDateTime={data.startDateTime} 
                      lockPeriod={data.lockPeriod}
                      asset={data.asset}
                      imgSrc="/images/Ethereum-logo.png" />
        <SmallPoolCard poolId={2} 
                      startDateTime={data.startDateTime} 
                      lockPeriod={data.lockPeriod}
                      asset="BTCUSD"
                      imgSrc="/images/Bitcoin-logo.png" />
      </div>
    </div>
  );
}

export default Home;
