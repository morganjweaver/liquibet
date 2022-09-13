import React from "react";
import { useState } from "react";
import { ethers, utils } from "ethers";
import NftListItem from "../shared/mySft/NftListItem";
import { useEffect } from "react";
import { getPoolSFTs, getPoolIds } from "../../services/poolService";
import LoadingComponent from "../shared/common/LoadingComponent";

function MySFTs() {
  const [dataFetched, updateDataFetched] = useState(false);
  const [pools, updatePools] = useState([]);

  useEffect(() => {
    (async () => {
      const poolIds = await getPoolIds();
      const pools = [];
      for (let poolId of poolIds) {
        pools.push(
          {
            id: poolId,
            sfts: await getPoolSFTs(poolId)
          });
      }
      
      updatePools(pools);
      updateDataFetched(true);
    })();
  }, []);
  
  if (!dataFetched) return <LoadingComponent />;

  return (
    <div className="px-16 mt-4 bg-primary font-1 text-white">
    {pools.map((pool, id) => {
      if (pool.sfts.length === 0) return;

      return (
      <div key={id} className="mb-4">
        <h1 className="mb-3">POOL {pool.id}</h1>
        <div className="">
          {(pool.sfts.length === 0) && <h2 className="pl-4">You have no SFTs in this pool.</h2>}
          {pool.sfts.map((sft, id) => (
            <NftListItem
              key={id}  
              image={sft.imgSrc}
              tier={sft.tierId}
              tokenId={sft.tokenId}
              amount={utils.formatUnits(sft.amount, 0)}
            />
          ))}
        </div>
      </div>
      )
    })}
    </div>
  );
}

export default MySFTs;
