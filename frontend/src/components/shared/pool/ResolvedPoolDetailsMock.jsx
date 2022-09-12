import React from 'react';
import { isTierLiquidated } from '../../../helpers/utils';

function  ResolvedPoolDetailsMock({id, tier, assetPair}) {
  let liquidated = isTierLiquidated(tier.liquidationPrice, assetPair);
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