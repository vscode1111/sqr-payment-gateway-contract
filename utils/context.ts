import { DeployProxyOptions } from '@openzeppelin/hardhat-upgrades/dist/utils';
import { ethers, upgrades } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getNetworkName } from '~common-contract';
import { ERC20_TOKEN_NAME, SQR_PAYMENT_GATEWAY_NAME, TOKENS, TX_OVERRIDES } from '~constants';
import { ContractConfig, getContractArgs, getTokenArgs } from '~seeds';
import { ERC20Token } from '~typechain-types/contracts/ERC20Token';
import { SQRPaymentGateway } from '~typechain-types/contracts/SQRPaymentGateway';
import { ERC20Token__factory } from '~typechain-types/factories/contracts/ERC20Token__factory';
import { SQRPaymentGateway__factory } from '~typechain-types/factories/contracts/SQRPaymentGateway__factory';
import {
  Addresses,
  ContextBase,
  DeployNetworks,
  ERC20TokenContext,
  SQRPaymentGatewayContext,
  Users,
} from '~types';

const OPTIONS: DeployProxyOptions = {
  initializer: 'initialize',
  kind: 'uups',
  txOverrides: TX_OVERRIDES,
};

export function getAddresses(network: keyof DeployNetworks): Addresses {
  const sqrPaymentGatewayAddress = TOKENS.SQR_PAYMENT_GATEWAY[network];
  return {
    sqrPaymentGatewayAddress,
  };
}

export function getAddressesFromHre(hre: HardhatRuntimeEnvironment) {
  return getAddresses(getNetworkName(hre));
}

export async function getUsers(): Promise<Users> {
  const [owner, user1, user2, user3, owner2, coldWallet, depositVerifier, withdrawVerifier] =
    await ethers.getSigners();

  const ownerAddress = await owner.getAddress();
  const user1Address = await user1.getAddress();
  const user2Address = await user2.getAddress();
  const user3Address = await user3.getAddress();
  const owner2Address = await owner2.getAddress();
  const coldWalletAddress = await coldWallet.getAddress();
  const depositVerifierAddress = await depositVerifier.getAddress();
  const withdrawVerifierAddress = await withdrawVerifier.getAddress();

  return {
    owner,
    ownerAddress,
    user1,
    user1Address,
    user2,
    user2Address,
    user3,
    user3Address,
    owner2,
    owner2Address,
    coldWallet,
    coldWalletAddress,
    depositVerifier,
    depositVerifierAddress,
    withdrawVerifier,
    withdrawVerifierAddress,
  };
}

export async function getERC20TokenContext(
  users: Users,
  deployData?: string | { newOwner: string },
): Promise<ERC20TokenContext> {
  const { owner, user1, user2, user3, owner2, owner2Address, coldWallet } = users;

  const testERC20TokenFactory = (await ethers.getContractFactory(
    ERC20_TOKEN_NAME,
  )) as unknown as ERC20Token__factory;

  let ownerERC20Token: ERC20Token;

  if (typeof deployData === 'string') {
    ownerERC20Token = testERC20TokenFactory.connect(owner).attach(deployData) as ERC20Token;
  } else {
    const newOwner = deployData?.newOwner ?? owner2Address;
    ownerERC20Token = await testERC20TokenFactory.connect(owner).deploy(...getTokenArgs(newOwner));
  }

  const erc20TokenAddress = await ownerERC20Token.getAddress();

  const user1ERC20Token = ownerERC20Token.connect(user1);
  const user2ERC20Token = ownerERC20Token.connect(user2);
  const user3ERC20Token = ownerERC20Token.connect(user3);
  const owner2ERC20Token = ownerERC20Token.connect(owner2);
  const coldWalletERC20Token = ownerERC20Token.connect(coldWallet);

  return {
    erc20TokenAddress,
    ownerERC20Token,
    user1ERC20Token,
    user2ERC20Token,
    user3ERC20Token,
    owner2ERC20Token,
    coldWalletERC20Token,
  };
}

export async function getSQRPaymentGatewayContext(
  users: Users,
  deployData?: string | ContractConfig,
): Promise<SQRPaymentGatewayContext> {
  const { owner, user1, user2, user3, owner2, coldWallet } = users;

  const sqrPaymentGatewayFactory = (await ethers.getContractFactory(
    SQR_PAYMENT_GATEWAY_NAME,
  )) as unknown as SQRPaymentGateway__factory;
  const owner2SqrPaymentGatewayFactory = (await ethers.getContractFactory(
    SQR_PAYMENT_GATEWAY_NAME,
    owner2,
  )) as unknown as SQRPaymentGateway__factory;

  let ownerSQRPaymentGateway: SQRPaymentGateway;

  if (typeof deployData === 'string') {
    ownerSQRPaymentGateway = sqrPaymentGatewayFactory
      .connect(owner)
      .attach(deployData) as SQRPaymentGateway;
  } else {
    ownerSQRPaymentGateway = (await upgrades.deployProxy(
      sqrPaymentGatewayFactory,
      getContractArgs(deployData as ContractConfig),
      OPTIONS,
    )) as unknown as SQRPaymentGateway;
  }

  const sqrPaymentGatewayAddress = await ownerSQRPaymentGateway.getAddress();

  const user1SQRPaymentGateway = ownerSQRPaymentGateway.connect(user1);
  const user2SQRPaymentGateway = ownerSQRPaymentGateway.connect(user2);
  const user3SQRPaymentGateway = ownerSQRPaymentGateway.connect(user3);
  const owner2SQRPaymentGateway = ownerSQRPaymentGateway.connect(owner2);
  const coldWalletSQRPaymentGateway = ownerSQRPaymentGateway.connect(coldWallet);

  return {
    sqrPaymentGatewayFactory,
    owner2SqrPaymentGatewayFactory: owner2SqrPaymentGatewayFactory,
    sqrPaymentGatewayAddress,
    ownerSQRPaymentGateway,
    user1SQRPaymentGateway,
    user2SQRPaymentGateway,
    user3SQRPaymentGateway,
    owner2SQRPaymentGateway,
    coldWalletSQRPaymentGateway,
  };
}

export async function getContext(
  erc20TokenAddress: string,
  sqrPaymentGatewayAddress: string,
): Promise<ContextBase> {
  const users = await getUsers();
  const erc20TokenContext = await getERC20TokenContext(users, erc20TokenAddress);
  const sqrPaymentGatewayContext = await getSQRPaymentGatewayContext(
    users,
    sqrPaymentGatewayAddress,
  );

  return {
    ...users,
    ...erc20TokenContext,
    ...sqrPaymentGatewayContext,
  };
}
