function getSftDetails(id) {
  if (id == 1) {
    return {
      id: 1,
      imgSrc: "https://gateway.pinata.cloud/ipfs/QmRf7fdqC5WVryZmfXH5PnHXs4SUzPfQ3RUrpwfDSvzTAa",
      poolId: 1,
      tierId: 1,
      poolStatus: "Open",
      status: "Health Level 3, OK!"
    }
  } else {
    
    return {
      id: 2,
      imgSrc: "https://gateway.pinata.cloud/ipfs/QmSoE4z3fqGunb9RWrLq9MzDE3qibJZoYgrPnfjCzdH748",
      poolId: 1,
      tierId: 2,
      poolStatus: "Closed",
      status: "Health Level 4, looking happy!"
    }
  }
}

export default getSftDetails;