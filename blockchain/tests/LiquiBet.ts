import { expect } from "chai";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { SFT } from "../typechain-types/contracts";
import { Liquibet } from "../typechain-types/contracts/LiquiBet.sol";
// eslint-disable-next-line node/no-unpublished-import
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// eslint-disable-next-line node/no-unpublished-import
import { BigNumber } from "ethers";

const TOKEN_UPDATE_INTERVAL = 100;
const LIQUIBET_CONTRACT_FEE = 10000;

describe("Liquibet contract", async () => {
  let tokenContract: SFT;
  let liquiBetContract: Liquibet;
  let accounts: SignerWithAddress[];
  
  beforeEach(async () => {
    accounts = await ethers.getSigners();
    const [tokenContractFactory, liquiBetContractFactory] =
      await Promise.all([
        ethers.getContractFactory("SFT"),
        ethers.getContractFactory("Liquibet"),
      ]);
    tokenContract = await tokenContractFactory.deploy(
      TOKEN_UPDATE_INTERVAL,
      accounts[1].address
    ) as SFT;
    await tokenContract.deployed();

    liquiBetContract = await liquiBetContractFactory.deploy(
      tokenContract.address,
      ethers.utils.parseEther(LIQUIBET_CONTRACT_FEE.toFixed(18)),
    ) as Liquibet;
    await liquiBetContract.deployed();
  });
  
  describe("When the liquibet contract is deployed", async function() {
    it("defines the fee amount", async function() {
      const purchaseRatio = Number(ethers.utils.formatEther(await liquiBetContract.fee()));
      expect(purchaseRatio).to.eq(LIQUIBET_CONTRACT_FEE);
    });

    it("uses valid ERC1155 token", async function() {
      const liquiBetContractAddress = await liquiBetContract.token();
      const tokenContractFactory = await ethers.getContractFactory("SFT");
      const tokenContract = await tokenContractFactory.attach(liquiBetContractAddress);

      const [tier1, initialPrice] = await Promise.all([
        tokenContract.TIER_1(),
        tokenContract.initialPrice()
      ]);

      expect(tier1.length).to.greaterThan(0);
      expect(initialPrice.length).to.greaterThan(0);
    });
  })
});