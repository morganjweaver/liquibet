import React from "react";
import LiquibetJSON from "../../Liquibet.json";
import SFTJSON from "../../SFT.json";
import { useState } from "react";
import { environment } from "../../environment";
import { toast } from "react-toastify";
import { ethers, utils } from "ethers";
import { formatDateTime, formatPeriod } from "../../helpers/dates";
import Tier from "../shared/Tier";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import NftListItem from "../NftListItem";
import { useEffect } from "react";

function MySFT() {
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

  async function getMySFTs() {
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
      const amounts = [];
      for (let i = 10; i < 15; i++) {
        let amountTier = await tokenContract.balanceOf(userAddress, i);
        amounts.push(amountTier);
      }

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

      let item = {
        owner: userAddress,
        tokenAddress: tokenAddress,
        // tokenContract: tokenContract,
        amountsTier: amounts,
      };

      console.log(item);
      updateData(item);
      updateDataFetched(true);
    } catch (e) {
      toast.error("Upload Error: " + e.message);
    }
  }
  useEffect(() => {
    getMySFTs();
  }, []);
  // if (!dataFetched) getMySFTs();

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
                ? parseInt(data.amountsTier[id]._hex)
                : 0
            }
          />
        ))}
      </div>
    </div>
  );
}

export default MySFT;
