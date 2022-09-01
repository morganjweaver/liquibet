import React from "react";
import { useState } from "react";
import { ethers, utils } from "ethers";
import { useParams } from "react-router-dom";
import NftListItem from "../NftListItem";
import { useEffect } from "react";
import { getMySFTs } from "../../blockchainAgent";

function MySFTs() {
  const [dataFetched, updateDataFetched] = useState(false);
  const [data, updateData] = useState({});
  const params = useParams();
  const poolId = params.id;

  const provider = new ethers.providers.Web3Provider(window.ethereum);

  let images = [
    "https://gateway.pinata.cloud/ipfs/QmaJ3ry7QYUjvCgao4oNF11qhhfeP9ThNkTCWFfM4Lqhqv",
    "https://gateway.pinata.cloud/ipfs/QmQQzfdhs3w95WTKLFFtHA8WEPA2XouyDzeVK74KS7vJ8a",
    "https://gateway.pinata.cloud/ipfs/QmRf7fdqC5WVryZmfXH5PnHXs4SUzPfQ3RUrpwfDSvzTAa",
    "https://gateway.pinata.cloud/ipfs/QmSoE4z3fqGunb9RWrLq9MzDE3qibJZoYgrPnfjCzdH748",
    "https://gateway.pinata.cloud/ipfs/QmPLUVrJ4vYm6PMnUGzUcqrwq3Xvk3SPN7wK3YtwcgDyGC",
  ];

  useEffect(() => {
    (async () => {
      let item = await getMySFTs(poolId);
      updateData(item);
      updateDataFetched(true);
    })();
  }, []);

  return (
    <div className="px-16 bg-primary h-screen">
      <h1 className="text-4xl text-white">My SFTs</h1>
      <h2 className="text-white mt-8">
        This page shows the amount of all SFTs of user {data.owner}.
      </h2>
      <div className="mt-4 px-2 grid grid-flow-row grid-cols-5 grid-rows-2 justify-center items-center pt-5 text-white">
        {images.map((image, id) => (
          <NftListItem
            key={id}
            image={image}
            tier={id + 1}
            amount={
              data.amountsTier != undefined
                ? utils.formatUnits(data.amountsTier[id], 0)
                : 0
            }
          />
        ))}
      </div>
    </div>
  );
}

export default MySFTs;
