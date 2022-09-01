import React from 'react'

function  ResolvedPoolDetailsMock({id, tier, assetPair}) {
  console.log("lowestPrice: " + assetPair.lowestPrice);
  console.log("price: " + assetPair.referencePrice * (tier.liquidationPrice / 100));
  let liquidated = assetPair.lowestPrice < assetPair.referencePrice - assetPair.referencePrice * (tier.liquidationPrice / 100);
  return (
    <div className='text-white'>
      <div className="my-3 tiers-resolution">
        <span>Tier {id}</span>
        <span style={{width: 230}}>Liquidation level: {tier.liquidationPrice}%</span>
        {liquidated && <span className='bg-redrounded bg-red-600 p-1'>LIQUIDATED</span>}
      </div>
    </div>
  ) 
}

export default ResolvedPoolDetailsMock