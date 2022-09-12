import React from "react";
import { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { useParams } from "react-router-dom";
import { getPoolData, getPoolSFTs, buySFT } from "../../services/poolService";
import LoadingComponent from "../shared/common/LoadingComponent";
import ResolvedPoolDetailsMock from "../shared/pool/ResolvedPoolDetailsMock";
import Tier from "../shared/pool/Tier";
import SmallSftCard from "../shared/pool/SmallSftCard";
import PoolStatusTag from "../shared/pool/PoolStatusTag";

function PoolDetails() {
  const [dataFetched, updateDataFetched] = useState(false);
  const [poolData, updatePoolData] = useState({});
  const [poolSfts, updatePoolSfts] = useState([]);
  
  const params = useParams();
  const poolId = params.id;
  
  async function buyInTier(poolId, tierId, price) {
    try {
      await buySFT(poolId, tierId, price);

      let poolSfts = await getPoolSFTs(poolId);
      updatePoolSfts(poolSfts);
      toast.success("You successfully bought the SFT!");
    } catch (e) {
      toast.error("Error: " + e.message);
    }
  }

  useEffect(() => {
    (async () => {
      let poolData = await getPoolData(poolId);
      let poolSfts = await getPoolSFTs(poolId);
      
      updatePoolData(poolData);
      updatePoolSfts(poolSfts);
      updateDataFetched(true);
    })();
  }, [poolId]);

  if (!dataFetched) return <LoadingComponent />;

  return (
    <div className="text-white font-1 mt-2">
      <div className="relative">
        <h1 className="text-center text-4xl">Pool {poolId}</h1>
        <PoolStatusTag locked={poolData.locked} resolved={poolData.resolved} cssClass="absolute left-8 top-2" />
      </div>
      <div className="pool-details w-100 h-200 mb-5 mt-2 py-4 px-4">
        <div className="flex">
          <div className="w-1/2">
            <h2 className="text-center">Details</h2>
            <hr className="my-2 border-[#B5289E]"/>
            <p>Asset: {poolData.assetPair.name}</p>
            <p>APY: {poolData.stakingApy}%</p> 
            <p>Total amount: {poolData.amountStaked} ETH</p>
            <p>Start Date: {poolData.startDateTime}</p>
            <p>Lock Period: {poolData.lockPeriod}</p>
            <p>Creator Fee: {poolData.creatorFee} ETH</p>
            <p>Contract Fee: {poolData.contractFee} ETH</p>
          </div>
          <div className="w-1/2">
            <h2 className="text-center">Tier levels</h2>
            <hr className="my-2 border-[#B5289E]"/>
            <div className="mt-4">
              {poolData.locked && (
                <div>
                  <p>Reference price: ${poolData.assetPair.referencePrice}</p>
                  <p>Lowest price: ${poolData.assetPair.lowestPrice}</p>
                  {poolData.tiers.map((tier, i) => <ResolvedPoolDetailsMock key={i} id={i} tier={tier} assetPair={poolData.assetPair} />)}
                </div>
              )}
              {!poolData.locked && 
                poolData.tiers.map((tier, i) => 
                  <Tier key={i} 
                        poolId={poolId} 
                        tierId={i} 
                        buyInPrice={tier.buyInPrice} 
                        liquidationPrice={tier.liquidationPrice}
                        buyInTier={buyInTier} />)}
            </div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <h2>My SFTs</h2>
          <hr className="my-2 border-[#B5289E]"/>
          {poolSfts.map(sft =>  
            <SmallSftCard key={sft.tokenId} amount={sft.amount} tokenId={sft.tokenId} imgSrc={sft.imgSrc} tierId={sft.tierId} status={sft.status} />
          )}
{/*           
          {poolData.resolved && (
            <div>
              <SmallSftCard key={sft.tokenId} amount={sft.amount} tokenId={sft.tokenId} imgSrc={sft.imgSrc} tierId={sft.tierId} status={sft.status} />
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}

export default PoolDetails;
