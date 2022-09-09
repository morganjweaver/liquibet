import { ethers } from 'ethers';
import { environment } from "../environment";
import LiquibetJSON from "../contracts/Liquibet.json";
import SFTJSON from "../contracts/SFT.json";

const provider = new ethers.providers.Web3Provider(window.ethereum);

function getLiquibetContract(signer) {
  return new ethers.Contract(
    environment.liquibetContractAddress,
    LiquibetJSON.abi,
    signer
  );
}

function getTokenContract(tokenAddress) {
  return new ethers.Contract(
    tokenAddress,
    SFTJSON.abi,
    provider
  );
}

async function isWalletConnected() {
  if (window.ethereum) {
    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });

    return accounts.length > 0;
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    alert("Get MetaMask!");
    return false;
  }

  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  if (chainId !== "0x5") {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x5" }],
    });
  }

  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  return accounts.length > 0;
}

export {
  isWalletConnected,
  connectWallet,
  getLiquibetContract,
  getTokenContract,
  provider
};