import React from "react";
import { useState, useEffect } from "react";
import SmallPoolCard from "../shared/SmallPoolCard";
import { getPoolData } from "../../blockchainAgent";

function Home() {

  const [dataFetched, updateDataFetched] = useState(false);
  const [data, updateData] = useState({});
  
  const poolId = 1;
  
  useEffect(() => {
    (async () => {
      let item = await getPoolData(poolId);
      updateData(item);
      updateDataFetched(true);
    })();
  }, []);

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
