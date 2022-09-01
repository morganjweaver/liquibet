import React from 'react';
import { Link } from "react-router-dom";

function SmallSftCard({tokenId, imgSrc, tierId, status}) {
  return (
    <div className="sft-small-card inline-block mx-4 border-[#3E0C55] border-1">
      <div className='relative'>
        <img src={imgSrc} width="180" className="mb-1 rounded" />
        <div className='px-3 py-1 absolute bottom-0 background-opaque'>
          <div>Tier {tierId}</div>
          <div>{status}</div>
        </div>
      </div>
      <Link to={`/sft/${tokenId}`} className="p-1">View details</Link>
    </div>
  )
}

export default SmallSftCard