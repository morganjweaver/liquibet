import { Contract, ethers } from "ethers"; // Hardhat for testing
import "dotenv/config";
import * as SFTJson from "../artifacts/contracts/SFT.sol/SFT.json";
import { SFT } from "../typechain-types";
import { checkBalance, getSigner } from "../helpers/utils";

async function main() {
  const signer = getSigner();
  if (!checkBalance(signer)) {
    return;
  }
  if (process.argv.length < 4) throw new Error("SFT address and/or SFT tier/pool ID missing");
  const tokenAddress = process.argv[2];
  const poolId_tierId = process.argv[3];
  const buyerAddress = process.argv[4];
  console.log(`Attaching token contract interface to address ${tokenAddress}`);
  const tokenContract: SFT = new Contract(
    tokenAddress,
    SFTJson.abi,
    signer
  ) as SFT;

  console.log(`Buying SFT ...`);
  const tx = await tokenContract.mint(buyerAddress, poolId_tierId, 1, "");
  console.log("Awaiting confirmations");
  await tx.wait();
  console.log(`Transaction completed. Hash: ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
