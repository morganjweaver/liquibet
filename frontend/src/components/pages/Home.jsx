import React from "react";
import { useState, useEffect } from "react";
import SmallPoolCard from "../shared/pool/SmallPoolCard";
import { getPools } from "../../services/poolService";
import LoadingComponent from "../shared/common/LoadingComponent";

function Home() {
  const [dataFetched, updateDataFetched] = useState(false);
  const [pools, updatePools] = useState([]);
  
  useEffect(() => {
    (async () => {
      updatePools(await getPools());
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
        {!dataFetched && <LoadingComponent />}
        
        {dataFetched && (
          <div className="text-center">
            {pools.map(pool => (
              <SmallPoolCard 
                key={pool.poolId}
                poolId={pool.poolId} 
                startDateTime={pool.startDateTime} 
                lockPeriod={pool.lockPeriod}
                asset={pool.assetPair.name}
                imgSrc="/images/Ethereum-logo.png" />
            ))}
          </div>
        )}
    </div>
  );
}

export default Home;
