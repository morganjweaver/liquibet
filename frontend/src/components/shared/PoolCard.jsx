import React from "react";
import LiquibetJSON from "../../Liquibet.json";
import { useState } from "react";
import { environment } from "../../environment";
import { toast } from 'react-toastify';
import { ethers, utils } from 'ethers';
import { formatDateTime, formatPeriod } from "../../helpers/dates";
import Tier from "./Tier";

function PoolCard() {
  const [dataFetched, updateDataFetched] = useState(false);
  const [data, updateData] = useState({});
  const [message, updateMessage] = useState("");
  
  const provider = new ethers.providers.Web3Provider(window.ethereum);

  let contract = new ethers.Contract(
    environment.liquibetContractAddress,
    LiquibetJSON.abi,
    provider
  );

  async function getPoolData() {

    const pool = await contract.pools(1);
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
      startDate: formatDateTime(pool.startDateTime),
      lockPeriod: formatPeriod(pool.lockPeriod),
      tiers: tiers
    };
    
    console.log(item);
    updateData(item);
    updateDataFetched(true);
  }

  async function buySFT(tierId, price) {
    try {
      const signer = provider.getSigner();

      let contract = new ethers.Contract(
        environment.liquibetContractAddress,
        LiquibetJSON.abi,
        signer
      );
      const salePrice = utils.parseUnits(price, "ether");
      // TODO did not manage to transform data.contractFee form hex to decimals
      const feePrice = utils.parseUnits("10000000", "wei");
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
        {data.tiers && 
          data.tiers.map((tier, i) => 
            <Tier key={i} 
                  tierId={i} 
                  buyInPrice={utils.formatEther(tier.buyInPrice)} 
                  liquidationPrice={utils.formatUnits(tier.liquidationPrice, 0)}
                  buySFT={buySFT} />)}
          
      </div>
      <div className="text-green text-center mt-3">{message}</div>
    </div>
  );
}

export default PoolCard;
