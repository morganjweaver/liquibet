import { expect } from "chai";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { SFT } from "../typechain-types/contracts";
import { Liquibet } from "../typechain-types/contracts/LiquiBet.sol";
import { AggregatorV3Interface } from "../typechain-types"
// eslint-disable-next-line node/no-unpublished-import
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// eslint-disable-next-line node/no-unpublished-import
import { BigNumber } from "ethers";

const TOKEN_UPDATE_INTERVAL = 100;
const LIQUIBET_CONTRACT_FEE = 10000;

const ASSET_DECIMALS: string = `18`;
const ASSET_INITIAL_PRICE: string = `200000000000000000000`;

describe("Liquibet contract", async () => {
  let tokenContract: SFT;
  let liquiBetContract: Liquibet;
  let accounts: SignerWithAddress[];
  
  beforeEach(async () => {
    accounts = await ethers.getSigners();

    const tokenContractFactory = await ethers.getContractFactory("SFT"); 
    const liquiBetContractFactory = await ethers.getContractFactory("Liquibet");
    const aggregatorContractFactory = await ethers.getContractFactory("MockV3Aggregator")
    
    const aggregatorContract = await aggregatorContractFactory.deploy(
      ASSET_DECIMALS,
      ASSET_INITIAL_PRICE
    )
    await aggregatorContract.deployed();

    tokenContract = await tokenContractFactory.deploy(
      TOKEN_UPDATE_INTERVAL,
      aggregatorContract.address
    ) as SFT;
    await tokenContract.deployed();

    liquiBetContract = await liquiBetContractFactory.deploy(
      tokenContract.address,
      ethers.utils.parseEther(LIQUIBET_CONTRACT_FEE.toFixed(18)),
    ) as Liquibet;
    await liquiBetContract.deployed();
  });
  
  describe("When the liquibet contract is deployed", async function() {
    it("should define the fee amount", async function() {
      const fee = Number(ethers.utils.formatEther(await liquiBetContract.fee()));
      expect(fee).to.eq(LIQUIBET_CONTRACT_FEE);
    });

    it("should use valid ERC1155 token", async function() {
      const liquiBetTokenContract = await liquiBetContract.token();
      const tokenContractFactory = await ethers.getContractFactory("SFT");
      const tokenContract = await tokenContractFactory.attach(liquiBetTokenContract);

      const [tier1, tier5, initialPrice] = await Promise.all([
        tokenContract.TIER_1(),
        tokenContract.TIER_5(),
        tokenContract.initialPrice()
      ]);

      expect(tier1).to.eq(1);
      expect(tier5).to.eq(5);
      expect(initialPrice).to.eq(ASSET_INITIAL_PRICE);
    });
  })
});