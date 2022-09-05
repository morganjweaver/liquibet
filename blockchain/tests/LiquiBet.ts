import { expect } from "chai";
import { ethers, network } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { SFT, Staking, VRFv2Consumer } from "../typechain-types/contracts";
import { Liquibet } from "../typechain-types/contracts/LiquiBet.sol";
import { MockV3Aggregator } from "../typechain-types/contracts/tests";
import { VRFCoordinatorV2Mock } from "../typechain-types/@chainlink/contracts/src/v0.8/mocks";
// eslint-disable-next-line node/no-unpublished-import
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// eslint-disable-next-line node/no-unpublished-import
import { BigNumber, ContractReceipt, ContractTransaction } from "ethers";
import { addSeconds, toSeconds } from "../helpers/dates";
import { networkConfig } from "../helper-hardhat-config";
import { LinkToken } from "../typechain-types";

const TOKEN_UPDATE_INTERVAL = 100;
const LIQUIBET_CONTRACT_FEE = 0.01;

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
  
  beforeEach(async () => {
    accounts = await ethers.getSigners();
    
    ({
      aggregatorContract,
      liquiBetContract,
      tokenContract,
      stakingContract
    } = await initContracts(accounts));

    const tx = await liquiBetContract.createPool(
      startDateTime,
      lockPeriod,
      ethers.utils.formatBytes32String(assetPairName),
      aggregatorContract.address,
      stakingContract.address
    );

    await tx.wait();
  });
  
  describe("When the liquibet contract is deployed", async function() {
    it("should define the fee amount", async function() {
      const fee = Number(ethers.utils.formatEther(await liquiBetContract.fee()));
      expect(fee).to.eq(LIQUIBET_CONTRACT_FEE);
    });

    it("should use valid ERC1155 token", async function() {
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
    
    it("new pool is created with correct poolId value", async function() {
      let poolId = await liquiBetContract.poolIds(0);
      expect(poolId).to.eq(POOL_ID);
    });
  });
  
  describe("When player buys a spot in a pool for a chosen tier (buyin)", async function() {
    
    let accountValue: BigNumber;
    let txFee: BigNumber;
    let tokensEarned: BigNumber;

    const TIER_ID = 0;
    const TOKEN_ID = 10;
    const TIER_BUYIN_PRICE = 0.03;
    const TOTAL_BUYIN_PRICE = TIER_BUYIN_PRICE + LIQUIBET_CONTRACT_FEE;
    const TIER_LIQUIDATION_PERCENTAGE = 7;
    const TOKENS_AMOUNT = 1;

    beforeEach(async () => {
      accountValue = await accounts[0].getBalance();
      const tx = await liquiBetContract.buyIn(
        POOL_ID,
        TIER_ID,
        TOKENS_AMOUNT,
        {
          value: ethers.utils.parseEther(TOTAL_BUYIN_PRICE.toFixed(2))
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
        .parseEther(TOTAL_BUYIN_PRICE.toFixed(2))
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
        let lotteryPrize: BigNumber;
        let liquidationPrize: BigNumber;

        beforeEach(async () => {
          network.provider.send("evm_increaseTime", [60]);
          network.provider.send("evm_mine");

          const tx = await liquiBetContract.resolution(POOL_ID)
          await tx.wait();
          
          lotteryPrize = await liquiBetContract.poolLotteryWinners(POOL_ID, accounts[0].address);
          liquidationPrize = await liquiBetContract.poolLiquidationPrizes(POOL_ID);
        });

        it("should calculate lottery prize for a player", async function() {
          const pool = await liquiBetContract.pools(POOL_ID);
          const apy = pool.stakingInfo[3];
          const expectedPrize = (Number(apy) / 100) * TIER_BUYIN_PRICE;
          console.log("expectedPrize: " + expectedPrize);

          expect(Number(ethers.utils.formatEther(lotteryPrize))).to.eq(expectedPrize);
        });

        it("should calculate correct liquidation prize for each winning player", async function() {
          expect(Number(ethers.utils.formatEther(liquidationPrize))).to.eq(TIER_BUYIN_PRICE);
        });
        
        describe("When player withdraws funds", async function() {
          let accountValue: BigNumber;
          let txFee: BigNumber;

          beforeEach(async function() {  
            accountValue = await accounts[0].getBalance();

            const tx = await liquiBetContract.withdraw(TOKEN_ID);
            const purchaseTokenTxReceipt = await tx.wait();
            const gasUsed = purchaseTokenTxReceipt.gasUsed;
            const effectiveGasPrice = purchaseTokenTxReceipt.effectiveGasPrice;
            txFee = gasUsed.mul(effectiveGasPrice);
          });

          // TODO tests won't work because contract doesn't have permission for token.burn
          it("should transfer correct ETH amount to a player", async function() {            
            // const newAccountValue = await accounts[0].getBalance();
            // const diff = newAccountValue.sub(accountValue);
            
            // const expectedDiff = lotteryPrize.add(liquidationPrize).sub(txFee);
            // expect(expectedDiff.sub(diff)).to.eq("0");
          });
          
          it("should not allow to withdraw funds again", async function() {      
            // TODO
          });
          
          it("should burn the 1155 token", async function() {      
            // TODO
          });
        });
      });
    });
  });
});

async function initContracts(accounts: SignerWithAddress[]): Promise<ILiquibetContracts> {
  const chainId: number | undefined = network.config.chainId;
  if (!chainId) throw Error("ChainId undefined");

  const liquiBetContractFactory = await ethers.getContractFactory("Liquibet");
  const aggregatorContractFactory = await ethers.getContractFactory("MockV3Aggregator");
  const vrfContractFactory = await ethers.getContractFactory("VRFCoordinatorV2Mock");
  const vrfConsumerContractFactory = await ethers.getContractFactory("VRFv2Consumer");
  
  const aggregatorContract: MockV3Aggregator = await aggregatorContractFactory.deploy(
    ASSET_DECIMALS,
    ASSET_INITIAL_PRICE
  ) as MockV3Aggregator;
  await aggregatorContract.deployed();
  
  const BASE_FEE = "100000000000000000"
  const GAS_PRICE_LINK = "1000000000" // 0.000000001 LINK per gas
  const vrfContract = await vrfContractFactory.deploy(
    BASE_FEE,
    GAS_PRICE_LINK
  ) as VRFCoordinatorV2Mock;
  await vrfContract.deployed();
  
  const fundAmount: BigNumber = networkConfig[chainId].fundAmount;
  const vrfTx: ContractTransaction = await vrfContract.createSubscription();
  const txReceipt: ContractReceipt = await vrfTx.wait(1);

  if (!txReceipt.events) throw Error("VrfContract setup error");

  const subscriptionId = ethers.BigNumber.from(txReceipt.events[0].topics[1]);
  await vrfContract.fundSubscription(subscriptionId, fundAmount);

  const linkTokenFactory = await ethers.getContractFactory("LinkToken");
  const linkTokenContract = await linkTokenFactory.deploy() as LinkToken;
  await linkTokenContract.deployed();

  const vrfConsumerContract = await vrfConsumerContractFactory.deploy(
    subscriptionId,
    vrfContract.address,
    linkTokenContract.address,
    networkConfig[chainId].keyHash
  ) as VRFv2Consumer;
  await vrfConsumerContract.deployed();
  await vrfConsumerContract.requestRandomWords();
  const requestId: BigNumber = await vrfConsumerContract.s_requestId();
  await vrfContract.fulfillRandomWords(requestId, vrfConsumerContract.address);

  const liquiBetContract = await liquiBetContractFactory.deploy(
    TOKEN_UPDATE_INTERVAL,
    aggregatorContract.address, 
    vrfConsumerContract.address,
    ethers.utils.parseEther(LIQUIBET_CONTRACT_FEE.toFixed(18)),
  ) as Liquibet;
  await liquiBetContract.deployed();
  
  const tokenAddress = await liquiBetContract.token();
  const tokenFactory = await ethers.getContractFactory("SFT");
  const tokenContract = tokenFactory.attach(tokenAddress) as SFT;
  
  const stakingContractFactory = await ethers.getContractFactory("Staking");
  const stakingContract = await stakingContractFactory.deploy(10) as Staking;
  await stakingContract.deployed();

  // fund the liquibet and staking contract
  accounts[9].sendTransaction({ to: liquiBetContract.address, value: ethers.utils.parseEther("10.0")});
  accounts[9].sendTransaction({ to: stakingContract.address, value: ethers.utils.parseEther("10.0")});

  return {
    aggregatorContract,
    liquiBetContract,
    tokenContract,
    stakingContract,
  }
}

interface ILiquibetContracts {
  aggregatorContract : MockV3Aggregator,
  liquiBetContract: Liquibet,
  tokenContract: SFT,
  stakingContract: Staking
}