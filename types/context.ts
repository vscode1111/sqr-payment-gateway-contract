import { Signer } from 'ethers';
import { SQRPaymentGateway } from '~typechain-types/contracts/SQRPaymentGateway';
import { ERC20Token } from '~typechain-types/contracts/ERC20Token';
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

export interface ERC20TokenContext {
  erc20TokenAddress: string;
  ownerERC20Token: ERC20Token;
  user1ERC20Token: ERC20Token;
  user2ERC20Token: ERC20Token;
  user3ERC20Token: ERC20Token;
  owner2ERC20Token: ERC20Token;
  coldWalletERC20Token: ERC20Token;
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

export type ContextBase = Users & ERC20TokenContext & SQRPaymentGatewayContext;
