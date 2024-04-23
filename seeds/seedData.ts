import dayjs from 'dayjs';
import { ZeroAddress } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { toUnixTime, toWei } from '~common';
import { MINUTES, ZERO } from '~constants';
import { DeployNetworkKey } from '~types';
import { addSeconsToUnixTime } from '~utils';
import { defaultNetwork } from '../hardhat.config';
import { ContractConfig, DeployContractArgs, DeployTokenArgs, TokenConfig } from './types';

const chainDecimals: Record<DeployNetworkKey, number> = {
  bsc: 8,
};

export const sqrDecimals = chainDecimals[defaultNetwork];

const isTest = true; //false - PROD!

if (!isTest) {
  throw 'Are you sure? It is PROD!';
}

const priceDiv = BigInt(1);
const userDiv = BigInt(2);
export const now = dayjs();

export const prodContractConfig: Partial<ContractConfig> = {
  newOwner: '0xA8B8455ad9a1FAb1d4a3B69eD30A52fBA82549Bb', //Matan
  erc20Token: '0x2B72867c32CF673F7b02d208B26889fEd353B1f8', //SQR
  coldWallet: '0x79734Db10D301C257093E594A8A245D384E22c68', //Andrey MultiSig
  balanceLimit: toWei(25_000, sqrDecimals),
};

//Test
// export const mainContractConfig: Partial<ContractConfig> = {
//   newOwner: '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF', //My s-owner2
//   erc20Token: '0x8364a68c32E581332b962D88CdC8dBe8b3e0EE9c', //tSQR2
//   depositVerifier: '0x99FbD0Bc026128e6258BEAd542ECB1cF165Bbb98', //My s-deposit
//   coldWallet: '0x21D73A5dF25DAB8AcB73E782f71678c3b00A198F', //My s-coldWallet
//   balanceLimit: toWei(1000, sqrDecimals) / priceDiv,
// };

//Real main
export const mainContractConfig: Partial<ContractConfig> = {
  newOwner: '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF', //My s-owner2
  erc20Token: '0x8364a68c32E581332b962D88CdC8dBe8b3e0EE9c', //tSQR2
  depositVerifier: '0x99FbD0Bc026128e6258BEAd542ECB1cF165Bbb98', //My s-deposit
  depositGoal: toWei(100_000, sqrDecimals),
  withdrawVerifier: ZeroAddress,
  withdrawGoal: BigInt(1),
  coldWallet: '0x21D73A5dF25DAB8AcB73E782f71678c3b00A198F', //My s-coldWallet
  balanceLimit: toWei(25_000, sqrDecimals) / priceDiv,
  startDate: 0,
  closeDate: 0,
};

const extContractConfig = isTest ? mainContractConfig : prodContractConfig;

export const contractConfig: ContractConfig = {
  newOwner: '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF',
  erc20Token: '0x4072b57e9B3dA8eEB9F8998b69C868E9a1698E54',
  depositVerifier: '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF',
  depositGoal: toWei(4_000, sqrDecimals) / priceDiv,
  withdrawVerifier: '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF',
  withdrawGoal: toWei(6_000, sqrDecimals) / priceDiv,
  startDate: toUnixTime(now.add(1, 'days').toDate()),
  closeDate: toUnixTime(now.add(2, 'days').toDate()),
  coldWallet: '0x21D73A5dF25DAB8AcB73E782f71678c3b00A198F',
  balanceLimit: toWei(1000, sqrDecimals),
  ...extContractConfig,
};

export function getContractArgs(contractConfig: ContractConfig): DeployContractArgs {
  const {
    newOwner,
    erc20Token,
    depositVerifier,
    depositGoal,
    withdrawVerifier,
    withdrawGoal,
    startDate,
    closeDate,
    coldWallet,
    balanceLimit,
  } = contractConfig;

  return [
    newOwner,
    erc20Token,
    depositVerifier,
    depositGoal,
    withdrawVerifier,
    withdrawGoal,
    startDate,
    closeDate,
    coldWallet,
    balanceLimit,
  ];
}

export const tokenConfig: TokenConfig = {
  name: 'empty',
  symbol: 'empty',
  newOwner: '0x81aFFCB2FaCEcCaE727Fa4b1B2ef534a1Da67791',
  initMint: toWei(1_000_000_000, sqrDecimals),
  decimals: sqrDecimals,
};

export function getTokenArgs(newOnwer: string): DeployTokenArgs {
  return [
    tokenConfig.name,
    tokenConfig.symbol,
    newOnwer,
    tokenConfig.initMint,
    tokenConfig.decimals,
  ];
}

const userInitBalance = toWei(10_000, sqrDecimals) / priceDiv;
const deposit1 = toWei(100, sqrDecimals) / priceDiv;
const extraDeposit1 = toWei(2500, sqrDecimals) / priceDiv;
const withdraw1 = toWei(30, sqrDecimals) / priceDiv;
const extraWithdraw1 = toWei(3000, sqrDecimals) / priceDiv;

const userId1 = uuidv4();
const userId2 = uuidv4();

const depositTransactionId1 = uuidv4();
const depositTransactionId2 = uuidv4();
const withdrawTransactionId1_0 = uuidv4();
const withdrawTransactionId1_1 = uuidv4();
const withdrawTransactionId2 = uuidv4();

export const seedData = {
  zero: toWei(0),
  userInitBalance,
  totalAccountBalance: tokenConfig.initMint,
  deposit1,
  deposit2: deposit1 / userDiv,
  deposit3: deposit1 / userDiv / userDiv,
  extraDeposit1,
  extraDeposit2: extraDeposit1 / userDiv,
  extraDeposit3: extraDeposit1 / userDiv / userDiv,
  withdraw1,
  withdraw2: withdraw1 / userDiv,
  withdraw3: withdraw1 / userDiv / userDiv,
  extraWithdraw1,
  extraWithdraw2: extraWithdraw1 / userDiv,
  extraWithdraw3: extraWithdraw1 / userDiv / userDiv,
  balanceLimit: toWei(100, sqrDecimals),
  allowance: toWei(1000000, sqrDecimals),
  balanceDelta: toWei(0.01, sqrDecimals),
  nowPlus1m: toUnixTime(now.add(1, 'minute').toDate()),
  startDatePlus1m: addSeconsToUnixTime(contractConfig.startDate, 1 * MINUTES),
  closeDatePlus1m: addSeconsToUnixTime(contractConfig.closeDate, 1 * MINUTES),
  timeShift: 10,
  userId1,
  userId2,
  depositTransactionId1,
  depositTransactionId2,
  withdrawTransactionId1_0,
  withdrawTransactionId1_1,
  withdrawTransactionId2,
  invalidNonce: 999,
  depositNonce1_0: 0,
  depositNonce1_1: 1,
  depositNonce2_0: 0,
  depositNonce3_0: 0,
  withdrawNonce1_0: 0,
  withdrawNonce1_1: 1,
  withdrawNonce2_0: 0,
  withdrawNonce3_0: 0,
};
