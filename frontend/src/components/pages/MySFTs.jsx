import React from "react";
import { useState } from "react";
import { ethers, utils } from "ethers";
import { useParams } from "react-router-dom";
import NftListItem from "../shared/mySft/NftListItem";
import { useEffect } from "react";
import { getPoolSFTs } from "../../blockchainAgent";
import LoadingComponent from "../shared/common/LoadingComponent";

function MySFTs() {
  const [dataFetched, updateDataFetched] = useState(false);
  const [data, updateData] = useState({});
  const [data2, updateData2] = useState({});
  const params = useParams();
  const poolId = 1;

  let images = [
    "https://gateway.pinata.cloud/ipfs/QmaJ3ry7QYUjvCgao4oNF11qhhfeP9ThNkTCWFfM4Lqhqv",
    "https://gateway.pinata.cloud/ipfs/QmQQzfdhs3w95WTKLFFtHA8WEPA2XouyDzeVK74KS7vJ8a",
    "https://gateway.pinata.cloud/ipfs/QmRf7fdqC5WVryZmfXH5PnHXs4SUzPfQ3RUrpwfDSvzTAa",
    "https://gateway.pinata.cloud/ipfs/QmSoE4z3fqGunb9RWrLq9MzDE3qibJZoYgrPnfjCzdH748",
    "https://gateway.pinata.cloud/ipfs/QmPLUVrJ4vYm6PMnUGzUcqrwq3Xvk3SPN7wK3YtwcgDyGC",
  ];

  useEffect(() => {
    (async () => {
      let item = await getPoolSFTs(poolId);
      let item2 = await getPoolSFTs(2);
      console.log(item);
      updateData(item);
      updateData2(item2);
      updateDataFetched(true);
    })();
  }, []);
  
  if (!dataFetched) return <LoadingComponent />;

  return (
    <div className="px-16 mt-4 bg-primary font-1 text-white">
      <h1 className="mb-3">POOL {poolId}</h1>
      <div className="">
        {data.sfts.map((sft, id) => (
          <NftListItem
            key={id}  
            image={sft.imgSrc}
            tier={sft.tierId}
            tokenId={sft.tokenId}
            amount={utils.formatUnits(data.sfts[id].amount, 0)}
          />
        ))}
      </div>
      <h1 className="mb-3">POOL 2</h1>
      <div className="">
        {data2.sfts.map((sft, id) => (
          <NftListItem
            key={id}  
            image={sft.imgSrc}
            tier={sft.tierId}
            tokenId={sft.tokenId}
            amount={utils.formatUnits(data.sfts[id].amount, 0)}
          />
        ))}
      </div>
    </div>
  );
}

export default MySFTs;
