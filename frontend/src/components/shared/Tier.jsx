import React from 'react';

function Tier({tierId, buyInPrice, liquidationPrice, buySFT}) {
  return (
    <div class="my-2">
      <button
        className="tier-btn text-white font-bold py-2 px-4 text-sm"
        onClick={() => buySFT(tierId, buyInPrice)}
      >
        TIER {tierId + 1}
      </button>
      <span class="inline-block ml-3">Buyin price: {buyInPrice} ETH, Liquidation level: {liquidationPrice}%</span>
    </div>
  )
}

export default Tier