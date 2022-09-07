import React from "react";
import { useState } from "react";
import { ethers, utils } from "ethers";
import NftListItem from "../shared/mySft/NftListItem";
import { useEffect } from "react";
import { getPoolSFTs } from "../../blockchainAgent";
import LoadingComponent from "../shared/common/LoadingComponent";

function MySFTs() {
  const [dataFetched, updateDataFetched] = useState(false);
  const [data, updateData] = useState([]);
  const [data2, updateData2] = useState([]);
  const poolId = 1;

  useEffect(() => {
    (async () => {
      let sfts = await getPoolSFTs(poolId);
      let sfts2 = await getPoolSFTs(2);
      console.log(sfts);
      updateData(sfts);
      updateData2(sfts2);
      updateDataFetched(true);
    })();
  }, []);
  
  if (!dataFetched) return <LoadingComponent />;

  return (
    <div className="px-16 mt-4 bg-primary font-1 text-white">
      <h1 className="mb-3">POOL {poolId}</h1>
      <div className="">
        {data.map((sft, id) => (
          <NftListItem
            key={id}  
            image={sft.imgSrc}
            tier={sft.tierId}
            tokenId={sft.tokenId}
            amount={utils.formatUnits(sft.amount, 0)}
          />
        ))}
      </div>
      <h1 className="mb-3">POOL 2</h1>
      <div className="">
        {data2.map((sft, id) => (
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
  );
}

export default MySFTs;
