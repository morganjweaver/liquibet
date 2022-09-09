import React from 'react';
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getSft, getPoolData } from "../../services/poolService";
import LoadingComponent from "../shared/common/LoadingComponent";
import { useNavigate  } from "react-router-dom";

function SftDetails() {
  const [dataFetched, updateDataFetched] = useState(false);
  const [sftData, updateSftData] = useState({});
  const [poolData, updatePoolData] = useState({});

  const navigate = useNavigate ();
  const params = useParams();
  const tokenId = parseInt(params.id);
  const poolId = Math.floor(tokenId / 10);

  useEffect(() => {
    (async () => {
      // let poolData = await getPoolData(poolId);
      let sft = await getSft(tokenId);
      console.log(sft);
      
      updatePoolData(poolData);
      updateSftData(sft);
      updateDataFetched(true);
    })();
  }, []);

  if (!dataFetched) return <LoadingComponent />;

  return (
    <div className='font-1 text-white mt-12 text-center sft-details'>
      <div className='inline-block'>
        <img src={sftData.imgSrc} width="500" className="rounded" />
        <div className='text-xl text-left leading-10 details-text'>
          <div>
            <span>POOL {poolId}</span> 
            <span>TIER {sftData.tierId}</span>
            <span>AMOUNT: {sftData.amount}</span>
          </div>
          <div><span>STATUS: {sftData.status}</span></div>
        </div>
      </div>
      <div className='mt-4'>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
    </div>
  )
}

export default SftDetails