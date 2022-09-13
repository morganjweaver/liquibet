import React from 'react';
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSft, getPoolData, withdraw } from "../../services/poolService";
import LoadingComponent from "../shared/common/LoadingComponent";
import PoolStatusTag from "../shared/pool/PoolStatusTag";
import { isTierLiquidated } from '../../helpers/utils';

function SftDetails() {
  const [dataFetched, updateDataFetched] = useState(false);
  const [isLiquidated, updateIsLiquidated] = useState(false);
  const [sftData, updateSftData] = useState({});
  const [pool, updatePool] = useState({});
  const [tier, updateTier] = useState({});

  const navigate = useNavigate ();
  const params = useParams();
  const tokenId = parseInt(params.id);
  const poolId = Math.floor(tokenId / 10);
  const tierId = tokenId % 10;

  useEffect(() => {
    (async () => {
      let pool = await getPoolData(poolId);
      let sft = await getSft(tokenId);
      console.log(sft);
      
      updateTier(pool.tiers[tierId]);
      updateIsLiquidated(isTierLiquidated(tier.liquidationPrice, pool.assetPair));
      
      updatePool(pool);
      updateSftData(sft);
      updateDataFetched(true);
    })();
  }, [poolId, tierId, tokenId, tier.liquidationPrice]);

  if (!dataFetched) return <LoadingComponent />;

  return (
    <div className='font-1 text-white mt-12 text-center sft-details'>
      <div className='grid grid-cols-2'>
        <img src={sftData.imgSrc} width="500" className="rounded mx-auto" alt="SFT" />
        <div className='text-xl text-left leading-10 details-text'>
          <div className='relative'>
            <div className='inline-block mr-8'>POOL {poolId}</div> 
            <PoolStatusTag locked={pool.locked} resolved={pool.resolved} />
          </div>
          <div>TIER {sftData.tierId}</div>
          <div>Buyin price: {tier.buyInPrice} ETH, Liquidation level: {tier.liquidationPrice}%</div>
          <hr className='my-4'/>
          <div>AMOUNT: {sftData.amount}</div>
          <div>STATUS: {sftData.status}</div>
          {pool.resolved && !isLiquidated && (
            <div className='w-100 text-center mt-8'>
              <button
                className="tier-btn text-white font-bold py-2 px-4 w-2/3"
                onClick={() => withdraw(tokenId)}
              >
                WITHDRAW
              </button>
            </div>
          )}
        </div>
      </div>
      <div className='mt-4'>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
    </div>
  )
}

export default SftDetails