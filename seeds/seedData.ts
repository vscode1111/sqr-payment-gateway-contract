import dayjs from 'dayjs';
import { ZeroAddress } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { toUnixTime, toWei } from '~common';
import { MINUTES } from '~constants';
import { DeployNetworkKey } from '~types';
import { addSeconsToUnixTime } from '~utils';
import { defaultNetwork } from '../hardhat.config';
import { ContractConfig, DeployContractArgs, DeployTokenArgs, TokenConfig } from './types';

type DeployType = 'test' | 'main' | 'stage' | 'prod';

const deployType: DeployType = (process.env.ENV as DeployType) ?? 'main';

const isSqr = ['test', 'main'].includes(deployType);
const isProd = deployType === ('prod' as any);

const chainDecimals: Record<DeployNetworkKey, number> = {
  bsc: isSqr ? 8 : 18, //SQR/USDT
};

export const tokenDecimals = chainDecimals[defaultNetwork];

if (isProd) {
  throw 'Are you sure? It is PROD!';
}

const priceDiv = BigInt(1);
const userDiv = BigInt(2);
export const now = dayjs();

export const contractConfigDeployMap: Record<DeployType, Partial<ContractConfig>> = {
  test: {
    newOwner: '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF', //My s-owner2
    erc20Token: '0x8364a68c32E581332b962D88CdC8dBe8b3e0EE9c', //tSQR2
    depositVerifier: '0x99FbD0Bc026128e6258BEAd542ECB1cF165Bbb98', //My s-deposit
    coldWallet: '0x21D73A5dF25DAB8AcB73E782f71678c3b00A198F', //My s-coldWallet
    balanceLimit: toWei(1000, tokenDecimals) / priceDiv,
  },
  main: {
    newOwner: '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF', //My s-owner2
    erc20Token: '0x8364a68c32E581332b962D88CdC8dBe8b3e0EE9c', //tSQR2
    depositVerifier: '0x99FbD0Bc026128e6258BEAd542ECB1cF165Bbb98', //My s-deposit
    depositGoal: toWei(100, tokenDecimals),
    withdrawVerifier: ZeroAddress,
    withdrawGoal: BigInt(1),
    coldWallet: '0x21D73A5dF25DAB8AcB73E782f71678c3b00A198F', //My s-coldWallet
    balanceLimit: toWei(25_000, tokenDecimals) / priceDiv,
    startDate: 0,
    // startDate: toUnixTime(new Date(2024, 3, 27)),
    closeDate: 0,
    // closeDate: toUnixTime(new Date(2024, 3, 30)),
  },
  stage: {
    newOwner: '0xA8B8455ad9a1FAb1d4a3B69eD30A52fBA82549Bb', //Matan
    erc20Token: '0x55d398326f99059fF775485246999027B3197955', //USDT
    coldWallet: '0x79734Db10D301C257093E594A8A245D384E22c68', //Andrey MultiSig
    depositVerifier: '0x99FbD0Bc026128e6258BEAd542ECB1cF165Bbb98', //My s-deposit
    depositGoal: toWei(1, tokenDecimals),
    balanceLimit: toWei(0.1, tokenDecimals),
    withdrawVerifier: ZeroAddress,
    withdrawGoal: BigInt(1),
    // startDate: 0,
    // startDate: toUnixTime(new Date(2024, 3, 27)),
    startDate: toUnixTime(new Date(2024, 4, 1, 11, 0, 0)),
    // closeDate: 0,
    // closeDate: toUnixTime(new Date(2024, 3, 30)),
    closeDate: toUnixTime(new Date(2024, 4, 3, 11, 0, 0)),
  },
  prod: {},
};

const extContractConfig = contractConfigDeployMap[deployType];

export const contractConfig: ContractConfig = {
  newOwner: '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF',
  erc20Token: '0x4072b57e9B3dA8eEB9F8998b69C868E9a1698E54',
  depositVerifier: '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF',
  depositGoal: toWei(4_000, tokenDecimals) / priceDiv,
  withdrawVerifier: '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF',
  withdrawGoal: toWei(6_000, tokenDecimals) / priceDiv,
  startDate: toUnixTime(now.add(1, 'days').toDate()),
  closeDate: toUnixTime(now.add(2, 'days').toDate()),
  coldWallet: '0x21D73A5dF25DAB8AcB73E782f71678c3b00A198F',
  balanceLimit: toWei(1000, tokenDecimals),
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
  initMint: toWei(1_000_000_000, tokenDecimals),
  decimals: tokenDecimals,
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

const userInitBalance = toWei(10_000, tokenDecimals) / priceDiv;
const deposit1 = toWei(100, tokenDecimals) / priceDiv;
const extraDeposit1 = toWei(2500, tokenDecimals) / priceDiv;
const withdraw1 = toWei(30, tokenDecimals) / priceDiv;
const extraWithdraw1 = toWei(3000, tokenDecimals) / priceDiv;

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
  balanceLimit: toWei(100, tokenDecimals),
  allowance: toWei(1000000, tokenDecimals),
  balanceDelta: toWei(0.01, tokenDecimals),
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
