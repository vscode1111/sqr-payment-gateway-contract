import { TransactionRequest } from 'ethers';
import { TokenDescription } from '~types';

export const VERSION = '1.5';

export const TX_OVERRIDES: TransactionRequest = {
  // gasPrice: 3_000_000_000,
  // gasLimit: 1_000_000,
};

export enum Token {
  tSQR = '0x8364a68c32E581332b962D88CdC8dBe8b3e0EE9c',
  USDT = '0x55d398326f99059fF775485246999027B3197955',
}

export const TOKENS_DESCRIPTIONS: Record<string, TokenDescription> = {
  [Token.tSQR]: {
    tokenName: 'tSQR2',
    decimals: 8,
  },
  [Token.USDT]: {
    tokenName: 'USDT',
    decimals: 18,
  },
};
