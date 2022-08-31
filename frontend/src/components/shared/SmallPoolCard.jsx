import React from "react";
import LiquibetJSON from "../../Liquibet.json";
import { useState } from "react";
import { environment } from "../../environment";
import { toast } from 'react-toastify';
import { ethers, utils } from 'ethers';
import { formatDateTime, formatPeriod } from "../../helpers/dates";
import { Link } from "react-router-dom";

function SmallPoolCard() {
  const [dataFetched, updateDataFetched] = useState(false);
  const [data, updateData] = useState({});
  const [message, updateMessage] = useState("");
  
  const poolId = 1;
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
    <div class="justify-center w-80 h-200 mx-2 mb-5 mt-8 bg-[#8B47E1] border-2 border-[#8B47E1] rounded font-1 text-white">
      <div class="px-4 py-3">
        <h1 class="text-center pb-3">POOL 1</h1>
        <h2>Asset: {data.asset}</h2>
        <p>Start Date: {data.startDate}</p>
        <p>Lock Period: {data.lockPeriod}</p>
        <img
          src="/images/Ethereum-logo.png"
          alt=""
          width={60}
          height={60}
          className="my-4 center"
        />
        {/* <button onClick={navigate .push("/pool")}></button> */}
        <div class="text-center">
          <Link to={`/pool/${poolId}`}>View details</Link>
        </div>
      </div>
    </div>
  );
}

export default SmallPoolCard;
