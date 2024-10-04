import { TransactionRequest } from 'ethers';
import { TokenDescription } from '~common-contract';

export const CONTRACT_VERSION = '2.2.1';
export const CONTRACT_NAME = 'PaymentGateway';

export const TX_OVERRIDES: TransactionRequest = {
  // gasPrice: 3_000_000_000,
  // gasLimit: 1_000_000,
};

export enum Token {
  tWEB3 = '0x8364a68c32E581332b962D88CdC8dBe8b3e0EE9c',
  WEB3 = '0x2B72867c32CF673F7b02d208B26889fEd353B1f8',
  USDT = '0x55d398326f99059fF775485246999027B3197955',
}

export const TOKENS_DESCRIPTIONS: Record<string, TokenDescription> = {
  [Token.tWEB3]: {
    tokenName: 'tWEB32',
    decimals: 8,
  },
  [Token.WEB3]: {
    tokenName: 'WEB32',
    decimals: 8,
  },
  [Token.USDT]: {
    tokenName: 'USDT',
    decimals: 18,
  },
};
