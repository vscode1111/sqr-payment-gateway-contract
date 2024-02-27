import { Signer } from 'ethers';
import { SQRPaymentGateway } from '~typechain-types/contracts/SQRPaymentGateway';
import { SQRToken } from '~typechain-types/contracts/SQRToken';
import { SQRPaymentGateway__factory } from '~typechain-types/factories/contracts/SQRPaymentGateway__factory';

export interface Users {
  owner: Signer;
  ownerAddress: string;
  user1: Signer;
  user1Address: string;
  user2: Signer;
  user2Address: string;
  user3: Signer;
  user3Address: string;
  owner2: Signer;
  owner2Address: string;
  coldWallet: Signer;
  coldWalletAddress: string;
}

export interface SQRTokenContext {
  sqrTokenAddress: string;
  ownerSQRToken: SQRToken;
  user1SQRToken: SQRToken;
  user2SQRToken: SQRToken;
  user3SQRToken: SQRToken;
  owner2SQRToken: SQRToken;
  coldWalletSQRToken: SQRToken;
}

export interface SQRPaymentGatewayContext {
  sqrPaymentGatewayFactory: SQRPaymentGateway__factory;
  owner2SqrPaymentGatewayFactory: SQRPaymentGateway__factory;
  sqrPaymentGatewayAddress: string;
  ownerSQRPaymentGateway: SQRPaymentGateway;
  user1SQRPaymentGateway: SQRPaymentGateway;
  user2SQRPaymentGateway: SQRPaymentGateway;
  user3SQRPaymentGateway: SQRPaymentGateway;
  owner2SQRPaymentGateway: SQRPaymentGateway;
  coldWalletSQRPaymentGateway: SQRPaymentGateway;
}

export type ContextBase = Users & SQRTokenContext & SQRPaymentGatewayContext;
