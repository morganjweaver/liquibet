import React from "react";
import LiquibetJSON from "../../Liquibet.json";
import { useState, useEffect } from "react";
import { environment } from "../../environment";
import { toast } from 'react-toastify';
import { ethers, utils } from 'ethers';
import { formatDateTime, formatPeriod } from "../../helpers/dates";
import Tier from "../shared/Tier";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import SmallSftCard from "../shared/SmallSftCard";
import { getPoolData } from "../../blockchainAgent";

function PoolDetails() {
  const [dataFetched, updateDataFetched] = useState(false);
  const [data, updateData] = useState({});
  const [message, updateMessage] = useState("");
  
  const params = useParams();
  const poolId = params.id;
  const provider = new ethers.providers.Web3Provider(window.ethereum);

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

  useEffect(() => {
    (async () => {
      let item = await getPoolData(poolId);
      updateData(item);
      updateDataFetched(true);
    })();
  }, []);

  return (
    <div className="text-white font-1 mt-2">
      <h1 className="text-center text-4xl">Pool {poolId}</h1>
      <div className="pool-details w-100 h-200 mb-5 mt-2 py-4 px-4">
        <div className="flex">
          <div className="w-1/2">
            <h2 className="text-center">Details</h2>
            <hr className="my-2 border-[#B5289E]"/>
            <p>Asset: {data.asset}</p>
            <p>APY: {data.stakingApy}%</p> 
            <p>Total amount: {data.amountStaked} ETH</p>
            <p>Start Date: {data.startDateTime}</p>
            <p>Lock Period: {data.lockPeriod}</p>
            <p>Creator Fee: {data.creatorFee} ETH</p>
            <p>Contract Fee: {data.contractFee} ETH</p>
          </div>
          <div className="w-1/2">
            <h2 className="text-center">Available tier levels</h2>
            <hr className="my-2 border-[#B5289E]"/>
            <div className="mt-4">
              {data.tiers && 
                data.tiers.map((tier, i) => 
                  <Tier key={i} 
                        tierId={i} 
                        buyInPrice={utils.formatEther(tier.buyInPrice)} 
                        liquidationPrice={utils.formatUnits(tier.liquidationPrice, 0)}
                        buySFT={buySFT} />)}
            </div>
          </div>
          <div className="text-center my-1">{message}</div>
        </div>
        <div className="mt-4 text-center">
          <h2>My SFTs</h2>
          <hr className="my-2 border-[#B5289E]"/>
          <SmallSftCard id={1} imgSrc="https://gateway.pinata.cloud/ipfs/QmRf7fdqC5WVryZmfXH5PnHXs4SUzPfQ3RUrpwfDSvzTAa" />
          <SmallSftCard id={2} imgSrc="https://gateway.pinata.cloud/ipfs/QmSoE4z3fqGunb9RWrLq9MzDE3qibJZoYgrPnfjCzdH748" />
        </div>
      </div>
    </div>
  );
}

export default PoolDetails;
