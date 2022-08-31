import React from 'react';

function Tier({tierId, buyInPrice, liquidationPrice, buySFT}) {
  return (
    <p className="mt-2">
      <button
        className=" bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
        onClick={() => buySFT(tierId, buyInPrice)}
      >
        Tier {tierId + 1}
      </button>
      <span>Buyin price: {buyInPrice}, Liquidation level: {liquidationPrice}%</span>
    </p>
  )
}

export default Tier