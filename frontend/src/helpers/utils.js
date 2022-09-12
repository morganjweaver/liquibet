import { utils } from 'ethers';

//TODO split this file in dedicated helpers if it becomes too bloated

function isTierLiquidated(liquidationPrice, assetPair) {
  return assetPair.lowestPrice < assetPair.referencePrice - assetPair.referencePrice * (liquidationPrice / 100);
}

// Chinlink feeds return to 8 decimal places NOT 18 so add 10 decimal places back in
function parseTokenUnits(assetName, amount){
  console.log("ASSET: %s; units %s", assetName, utils.formatEther(amount));
  if (assetName === "ETHUSD" || assetName === "LINKUSD"){
    return (Math.round((utils.formatEther(amount)*1e10)*100)/100).toFixed(2);
  } else if (assetName === "BTCUSD"){
  console.log("ASSET: %s; units %s", assetName, (amount/100000000));
    return (amount / 100000000);
  }
  else throw new Error("Couldn't parse asset name %s", assetName);
}

export {
  isTierLiquidated,
  parseTokenUnits
};