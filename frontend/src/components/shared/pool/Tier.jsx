import React from 'react';

function Tier({poolId, tierId, buyInPrice, liquidationPrice, buyInTier}) {
  return (
    <div className="my-5">
      <button
        className="tier-btn w-36 text-white font-bold py-2 px-4 text-sm"
        onClick={() => buyInTier(poolId, tierId, buyInPrice)}
      >
        BUY TIER {tierId}
      </button>
      <span className="inline-block ml-3">Buyin price: {buyInPrice} ETH, Liquidation level: {liquidationPrice}%</span>
    </div>
  )
}

export default Tier