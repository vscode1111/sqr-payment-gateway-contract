import { Signer } from 'ethers';
import { ERC20Token } from '~typechain-types/contracts/ERC20Token';
import { WEB3PaymentGateway } from '~typechain-types/contracts/WEB3PaymentGateway';
import { WEB3PaymentGateway__factory } from '~typechain-types/factories/contracts/WEB3PaymentGateway__factory';

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
  depositVerifier: Signer;
  depositVerifierAddress: string;
  withdrawVerifier: Signer;
  withdrawVerifierAddress: string;
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

export interface WEB3PaymentGatewayContext {
  web3PaymentGatewayFactory: WEB3PaymentGateway__factory;
  owner2Web3PaymentGatewayFactory: WEB3PaymentGateway__factory;
  web3PaymentGatewayAddress: string;
  ownerWEB3PaymentGateway: WEB3PaymentGateway;
  user1WEB3PaymentGateway: WEB3PaymentGateway;
  user2WEB3PaymentGateway: WEB3PaymentGateway;
  user3WEB3PaymentGateway: WEB3PaymentGateway;
  owner2WEB3PaymentGateway: WEB3PaymentGateway;
  coldWalletWEB3PaymentGateway: WEB3PaymentGateway;
}

export type ContextBase = Users & ERC20TokenContext & WEB3PaymentGatewayContext;
