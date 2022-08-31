import React from "react";
import LiquibetJSON from "../../Liquibet.json";
import { useState } from "react";
import { environment } from "../../environment";
import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import { formatDateTime, formatPeriod } from "../../helpers/dates";

function PoolCard() {
  const [dataFetched, updateDataFetched] = useState(false);
  const [data, updateData] = useState({});
  const [message, updateMessage] = useState("");

  async function getPoolData() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    let contract = new ethers.Contract(
      environment.liquibetContractAddress,
      LiquibetJSON.abi,
      provider
    );

    const pool = await contract.pools(1);
    const fee = await contract.fee();

    let item = {
      asset: ethers.utils.parseBytes32String(pool.assetPair.name),
      creatorFee: ethers.utils.formatEther(pool.creatorFee),
      contractFee: ethers.utils.formatEther(fee),
      startDate: formatDateTime(pool.startDateTime),
      lockPeriod: formatPeriod(pool.lockPeriod),
    };
    
    console.log(item);
    updateData(item);
    updateDataFetched(true);
  }

  async function buySFT(tierId, price) {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      let contract = new ethers.Contract(
        environment.liquibetContractAddress,
        LiquibetJSON.abi,
        signer
      );
      const salePrice = ethers.utils.parseUnits(price, "ether");
      // TODO did not manage to transform data.contractFee form hex to decimals
      const feePrice = ethers.utils.parseUnits("10000000", "wei");
      const totalPrice = salePrice.add(feePrice);
      updateMessage("Buying the SFT... Please Wait (Upto 5 mins)");
      //run the executeSale function
      let transaction = await contract.buyIn(1, tierId, 1, {
        value: totalPrice,
      });
      await transaction.wait();

      toast.success("You successfully bought the SFT!");
      updateMessage("");
    } catch (e) {
      toast.error("Upload Error: " + e.message);
    }
  }

  if (!dataFetched) getPoolData();

  return (
    <div className="justify-center w-80 h-200 mx-2 mb-5 mt-8 bg-[#49B649] border-2 border-[#B5289E] rounded">
      <div className="ml-4">
        <h2>Asset: {data.asset}</h2>
        <p>Start Date: {data.startDate}</p>
        <p>Lock Period: {data.lockPeriod}</p>
        <p>Creator Fee: {data.creatorFee}</p>
        <p>Contract Fee: {data.contractFee}</p>
        <p className="mt-2">
          <button
            className=" bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
            onClick={() => buySFT(0, "0.03")}
          >
            Tier 1
          </button>
        </p>
        <p className="mt-2">
          <button
            className=" bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
            onClick={() => buySFT(1, "0.06")}
          >
            Tier 2
          </button>
        </p>
        <p className="mt-2">
          <button
            className=" bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
            onClick={() => buySFT(2, "0.3")}
          >
            Tier 3
          </button>
        </p>
        <p className="mt-2">
          <button
            className=" bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
            onClick={() => buySFT(3, "0.9")}
          >
            Tier 4
          </button>
        </p>
        <p className="mt-2">
          <button
            className=" bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
            onClick={() => buySFT(4, "3")}
          >
            Tier 5
          </button>
        </p>
      </div>
      <div className="text-green text-center mt-3">{message}</div>
    </div>
  );
}

export default PoolCard;
