import { expect } from "chai";
import { ethers, network } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { SFT, Staking } from "../typechain-types/contracts";
import { Liquibet } from "../typechain-types/contracts/LiquiBet.sol";
import { MockV3Aggregator } from "../typechain-types/contracts/tests";
// eslint-disable-next-line node/no-unpublished-import
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// eslint-disable-next-line node/no-unpublished-import
import { BigNumber } from "ethers";
import { addSeconds, toSeconds } from "../helpers/dates";
import { Liquibet__factory } from "../typechain-types";

const TOKEN_UPDATE_INTERVAL = 100;
const LIQUIBET_CONTRACT_FEE = 1000;

const ASSET_DECIMALS: string = `18`;
const ASSET_INITIAL_PRICE: string = `200000000000000000000`;

const POOL_ID = 1;

describe("Liquibet contract", async () => {
  let tokenContract: SFT;
  let liquiBetContract: Liquibet;
  let aggregatorContract: MockV3Aggregator;
  let accounts: SignerWithAddress[];
  
  const now = new Date();
  const startDateTime = toSeconds(addSeconds(now, 30)); 
  const lockPeriod = 10;
  const assetPairName = "ETHUSD";
  let stakingContract: Staking;
  let keeperAddress = ""; //TODO keeper mock address;
  
  beforeEach(async () => {
    accounts = await ethers.getSigners();
    keeperAddress = accounts[0].address;

    const tokenContractFactory = await ethers.getContractFactory("SFT"); 
    const liquiBetContractFactory = await ethers.getContractFactory("Liquibet");
    const aggregatorContractFactory = await ethers.getContractFactory("MockV3Aggregator");
    
    aggregatorContract = await aggregatorContractFactory.deploy(
      ASSET_DECIMALS,
      ASSET_INITIAL_PRICE
    ) as MockV3Aggregator;
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
    
    const stakingContractFactory = await ethers.getContractFactory("Staking");
    stakingContract = await stakingContractFactory.deploy(10) as Staking;
    await stakingContract.deployed();

    const tx = await liquiBetContract.createPool(
      startDateTime,
      lockPeriod,
      ethers.utils.formatBytes32String(assetPairName),
      aggregatorContract.address,
      stakingContract.address,
      keeperAddress
    );

    await tx.wait();
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
  });
  
  describe("When admin user creates new pool", async function() {
    
    it("new pool is created with id 1", async function() {
      let poolId = await liquiBetContract.poolIds(0);
      expect(poolId).to.eq(1);
    });
  });
  
  describe("When player buys a spot in a pool for a chosen tier (buyin)", async function() {
    
    let accountValue: BigNumber;
    let txFee: BigNumber;
    let tokensEarned: BigNumber;

    const TIER_ID = 1;
    const TOKEN_ID = 11;
    const TIER_BUYIN_PRICE = 50;
    const TOTAL_BUYIN_PRICE = TIER_BUYIN_PRICE + LIQUIBET_CONTRACT_FEE;
    const TIER_LIQUIDATION_PRICE = 7;
    const TOKENS_AMOUNT = 1;

    beforeEach(async () => {
      accountValue = await accounts[0].getBalance();
      const tx = await liquiBetContract.buyIn(
        POOL_ID,
        TIER_ID,
        TOKENS_AMOUNT,
        {
          value: ethers.utils.parseEther(TOTAL_BUYIN_PRICE.toFixed(0))
        }  
      );
      const purchaseTokenTxReceipt = await tx.wait();
      const gasUsed = purchaseTokenTxReceipt.gasUsed;
      const effectiveGasPrice = purchaseTokenTxReceipt.effectiveGasPrice;
      txFee = gasUsed.mul(effectiveGasPrice);
      tokensEarned = await tokenContract.balanceOf(accounts[0].address, TOKEN_ID);
    });

    it("charges corrent amount of ETH based on chosen tier level", async function() {
      const newAccountValue = await accounts[0].getBalance();
      const diff = accountValue.sub(newAccountValue);
      const expectedDiff = ethers.utils
        .parseEther(TOTAL_BUYIN_PRICE.toFixed(0))
        .add(txFee);
      expect(expectedDiff.sub(diff)).to.eq("0");
    });

    it("token is minted and transfered to the player", async function() {
      expect(tokensEarned.toString()).to.eq(TOKENS_AMOUNT.toString());
    });

    it("token has correct tokenId based on poolId and tierId", async function() {
      let tokenBalance = await tokenContract.balanceOf(accounts[0].address, TOKEN_ID)
      expect(tokenBalance).to.be.greaterThan(0);
    });
    
    it("total players count increased by one", async function() {
      const pool = await liquiBetContract.pools(POOL_ID);
      expect(pool[6]).to.eq(1);
    });
    
    it("player address added to tier players", async function() {
      const playerAddress = await liquiBetContract.tierPlayers(POOL_ID, TIER_ID, 0);
      expect(playerAddress).to.eq(accounts[0].address);
    });
    
    it("pool amount to be staked incresed for correct value", async function() {
      const pool = await liquiBetContract.pools(POOL_ID);
      const amountStaked = pool.stakingInfo[4];
      expect(Number(ethers.utils.formatEther(amountStaked))).to.eq(TIER_BUYIN_PRICE);
    });
    
    describe("When the pool buy-in period ends", async function() {
      beforeEach(async () => {
        const stakingTx = await liquiBetContract.stakePoolFunds(POOL_ID);
        await stakingTx.wait();
      });

      describe("When the pool lock-in period ends", async function() {
        beforeEach(async () => {
          network.provider.send("evm_increaseTime", [60]);
          network.provider.send("evm_mine");

          const tx = await liquiBetContract.resolution(POOL_ID)
          await tx.wait();
        });

        it("should calculate lottery winning for a player", async function() {
          const lotteryPrize = await liquiBetContract.poolLotteryWinners(POOL_ID, accounts[0].address);
          expect(lotteryPrize).to.eq(10);
        });

        it("should calculate correct liquidation prize for each winning player", async function() {
          const liquidationPrize = await liquiBetContract.poolLiquidationPrizes(POOL_ID);
          expect(liquidationPrize).to.eq(10);
        });
      });
    });
  });
});

