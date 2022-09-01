import React from "react";
import LiquibetJSON from "../../Liquibet.json";
import { useState, useEffect } from "react";
import { environment } from "../../environment";
import { toast } from 'react-toastify';
import { ethers, utils } from 'ethers';
import Tier from "../shared/Tier";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import SmallSftCard from "../shared/SmallSftCard";
import { getPoolData, getPoolSFTs } from "../../blockchainAgent";
import LoadingComponent from "../shared/LoadingComponent";

function PoolDetails() {
  const [dataFetched, updateDataFetched] = useState(false);
  const [poolData, updatePoolData] = useState({});
  const [poolSfts, updatePoolSfts] = useState({});
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
      // TODO did not manage to transform poolData.contractFee form hex to decimals
      const feePrice = utils.parseUnits("10000000", "wei");
      const totalPrice = salePrice.add(feePrice);
      updateMessage("Buying the SFT... Please Wait (Up to 5 mins)");
      //run the executeSale function
      let transaction = await contract.buyIn(1, tierId, 1, {
        value: totalPrice,
      });
      await transaction.wait();

      let poolSfts = await getPoolSFTs(poolId);
      updatePoolSfts(poolSfts);

      toast.success("You successfully bought the SFT!");
      updateMessage("");
    } catch (e) {
      toast.error("Upload Error: " + e.message);
    }
  }

  useEffect(() => {
    (async () => {
      let poolData = await getPoolData(poolId);
      let poolSfts = await getPoolSFTs(poolId);
      console.log("poolSfts: " + poolSfts);
      updatePoolData(poolData);
      updatePoolSfts(poolSfts);
      updateDataFetched(true);
    })();
  }, []);

  if (!dataFetched) return <LoadingComponent />;

  return (
    <div className="text-white font-1 mt-2">
      <h1 className="text-center text-4xl">Pool {poolId}</h1>
      <div className="pool-details w-100 h-200 mb-5 mt-2 py-4 px-4">
        <div className="flex">
          <div className="w-1/2">
            <h2 className="text-center">Details</h2>
            <hr className="my-2 border-[#B5289E]"/>
            <p>Asset: {poolData.asset}</p>
            <p>APY: {poolData.stakingApy}%</p> 
            <p>Total amount: {poolData.amountStaked} ETH</p>
            <p>Start Date: {poolData.startDateTime}</p>
            <p>Lock Period: {poolData.lockPeriod}</p>
            <p>Creator Fee: {poolData.creatorFee} ETH</p>
            <p>Contract Fee: {poolData.contractFee} ETH</p>
          </div>
          <div className="w-1/2">
            <h2 className="text-center">Available tier levels</h2>
            <hr className="my-2 border-[#B5289E]"/>
            <div className="mt-4">
              {poolData.tiers && 
                poolData.tiers.map((tier, i) => 
                  <Tier key={i} 
                        tierId={i} 
                        buyInPrice={utils.formatEther(tier.buyInPrice)} 
                        liquidationPrice={utils.formatUnits(tier.liquidationPrice, 0)}
                        buySFT={buySFT} />)}
            </div>
          </div>
        </div>
        <div className="text-center my-1">{message}</div>
        <div className="mt-4 text-center">
          <h2>My SFTs</h2>
          <hr className="my-2 border-[#B5289E]"/>
          {poolSfts.sfts.map(sft =>  
            <SmallSftCard key={sft.tokenId} amount={sft.amount} tokenId={sft.tokenId} imgSrc={sft.imgSrc} tierId={sft.tierId} status={sft.status} />
          )}
        </div>
      </div>
    </div>
  );
}

export default PoolDetails;
