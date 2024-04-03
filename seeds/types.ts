import { BigNumberish } from 'ethers';

export interface ContractConfig {
  newOwner: string;
  erc20Token: string;
  depositVerifier: string;
  depositGoal: bigint;
  withdrawVerifier: string;
  withdrawGoal: bigint;
  startDate: number;
  closeDate: number;
  coldWallet: string;
  balanceLimit: bigint;
}

export type DeployContractArgs = [
  newOwner: string,
  erc20Token: string,
  depositVerifier: string,
  depositGoal: BigNumberish,
  withdrawVerifier: string,
  withdrawGoal: BigNumberish,
  startDate: number,
  closeDate: number,
  coldWallet: string,
  balanceLimit: BigNumberish,
];

export interface TokenConfig {
  name: string;
  symbol: string;
  newOwner: string;
  initMint: bigint;
  decimals: number;
}

export type DeployTokenArgs = [
  name_: string,
  symbol_: string,
  newOwner: string,
  initMint: bigint,
  decimals_: bigint | number,
];
