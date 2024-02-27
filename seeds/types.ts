import { BigNumberish } from 'ethers';

export interface ContractConfig {
  newOwner: string;
  sqrToken: string;
  coldWallet: string;
  balanceLimit: bigint;
}

export type DeployContractArgs = [
  newOwner: string,
  sqrToken: string,
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
