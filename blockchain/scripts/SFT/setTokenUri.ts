import { Contract, ethers } from "ethers"; // Hardhat for testing
import "dotenv/config";
import * as SFTJson from "../../artifacts/contracts/SFT.sol/SFT.json";
import { SFT } from "../../typechain-types";
import { checkBalance, getSigner } from "../../helpers/utils";

async function main() {
  const signer = getSigner();
  if (!checkBalance(signer)) {
    return;
  }
  if (process.argv.length < 3) throw new Error("SFT address missing");
  const tokenAddress = process.argv[2];

  console.log(`Attaching token contract interface to address ${tokenAddress}`);
  const tokenContract: SFT = new Contract(
    tokenAddress,
    SFTJson.abi,
    signer
  ) as SFT;

  console.log(`Set Token Uri ...`);
  const tx = await tokenContract.setTokenUri(
    1,
    "https://liquibet.infura-ipfs.io/ipfs/QmTCDNmaz2UGH5e8eRxo5uGK1sx1SEwehvTTiHkMoNMzFk",
  );
  console.log("Awaiting confirmations");
  await tx.wait();
  console.log(`Transaction completed. Hash: ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
