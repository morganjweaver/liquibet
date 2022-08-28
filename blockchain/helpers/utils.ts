import { ethers } from "ethers";

// TODO split this file into dedicated helpers, DO NOT allow it to bloat out of hand

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
  "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f";

function convertStringArrayToBytes32(array: string[]) {
  const bytes32Array: any[] = [];
  for (let index = 0; index < array.length; index++) {
    bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
  }
  return bytes32Array;
}

async function checkBalance(signer: ethers.Wallet): Promise<boolean> {
  const balanceBN = await signer.getBalance();
  const balance = Number(ethers.utils.formatEther(balanceBN));
  console.log(`Wallet balance ${balance}`);
  if (balance < 0.01) {
    console.log("INSUFFICIENT ETH BALANCE");
    return false;
  }
  return true;
}

function getVRFSubscriptionValue() {
  const subscriptionId = process.env.VRF_SUBSCRIPTION_ID;
  if (!subscriptionId){
    throw Error("Please set VRF Subscription ID in your .env");
  }
  return subscriptionId;
}
function getSigner(): ethers.Wallet {
  const wallet =
    process.env.ADMIN_WALLET_SEED && process.env.ADMIN_WALLET_SEED.length > 0
      ? ethers.Wallet.fromMnemonic(process.env.ADMIN_WALLET_SEED)
      : new ethers.Wallet(process.env.PRIVATE_KEY ?? EXPOSED_KEY);

  console.log(`Using address ${wallet.address}`);

  const provider = ethers.providers.getDefaultProvider(
    process.env.PROVIDER_NETWORK
  );

  return wallet.connect(provider);
}

export { checkBalance, getSigner, convertStringArrayToBytes32, EXPOSED_KEY };
