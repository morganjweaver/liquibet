import React from "react";
import LiquibetJSON from "../../Liquibet.json";
import { useState } from "react";
import { environment } from "../../environment";
import { toast } from 'react-toastify';
import { ethers, utils } from 'ethers';
import { formatDateTime, formatPeriod } from "../../helpers/dates";
import Tier from "../shared/Tier";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom"

function Pool() {
  const [dataFetched, updateDataFetched] = useState(false);
  const [data, updateData] = useState({});
  const [message, updateMessage] = useState("");
  
  const params = useParams();
  const poolId = params.id;
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
      startDate: formatDateTime(pool.startDateTime),
      lockPeriod: formatPeriod(pool.lockPeriod),
      stakingApy: utils.formatUnits(pool.stakingInfo.apy, 0),
      amountStaked: utils.formatEther(pool.stakingInfo.amountStaked),
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
    <div class="text-white font-1 mt-2">
      <h1 class="text-center text-4xl">Pool {poolId}</h1>
      <div className="pool-details backdrop-1 justify-center w-100 h-200 mb-5 mt-4 py-4 px-4 border-2 border-[#B5289E] rounded">
        <div className="ml-4">
          <p>Asset: {data.asset}</p>
          <p>APY: {data.stakingApy}%</p> 
          <p>Total amount: {data.amountStaked} ETH</p>
          <p>Start Date: {data.startDate}</p>
          <p>Lock Period: {data.lockPeriod}</p>
          <p>Creator Fee: {data.creatorFee} ETH</p>
          <p>Contract Fee: {data.contractFee} ETH</p>
          <h2 class="text-center">Available tier levels</h2>
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
    </div>
  );
}

export default Pool;
