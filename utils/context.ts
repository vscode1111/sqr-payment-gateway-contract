import { DeployProxyOptions } from '@openzeppelin/hardhat-upgrades/dist/utils';
import { ethers, upgrades } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getNetworkName } from '~common';
import { SQR_PAYMENT_GATEWAY_NAME, SQR_TOKEN_NAME, TOKENS } from '~constants';
import { ContractConfig, getContractArgs, getTokenArgs } from '~seeds';
import { SQRPaymentGateway } from '~typechain-types/contracts/SQRPaymentGateway';
import { SQRToken } from '~typechain-types/contracts/SQRToken';
import { SQRPaymentGateway__factory } from '~typechain-types/factories/contracts/SQRPaymentGateway__factory';
import { SQRToken__factory } from '~typechain-types/factories/contracts/SQRToken__factory';
import {
  Addresses,
  ContextBase,
  DeployNetworks,
  SQRPaymentGatewayContext,
  SQRTokenContext,
  Users,
} from '~types';

const OPTIONS: DeployProxyOptions = {
  initializer: 'initialize',
  kind: 'uups',
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
  const [owner, user1, user2, user3, owner2, coldWallet] = await ethers.getSigners();

  const ownerAddress = await owner.getAddress();
  const user1Address = await user1.getAddress();
  const user2Address = await user2.getAddress();
  const user3Address = await user3.getAddress();
  const owner2Address = await owner2.getAddress();
  const coldWalletAddress = await coldWallet.getAddress();

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
  };
}

export async function getSQRTokenContext(
  users: Users,
  deployData?: string | { newOnwer: string },
): Promise<SQRTokenContext> {
  const { owner, user1, user2, user3, owner2, owner2Address, coldWallet } = users;

  const testSQRTokenFactory = (await ethers.getContractFactory(
    SQR_TOKEN_NAME,
  )) as unknown as SQRToken__factory;

  let ownerSQRToken: SQRToken;

  if (typeof deployData === 'string') {
    ownerSQRToken = testSQRTokenFactory.connect(owner).attach(deployData) as SQRToken;
  } else {
    const newOnwer = deployData?.newOnwer ?? owner2Address;
    ownerSQRToken = await testSQRTokenFactory.connect(owner).deploy(...getTokenArgs(newOnwer));
  }

  const sqrTokenAddress = await ownerSQRToken.getAddress();

  const user1SQRToken = ownerSQRToken.connect(user1);
  const user2SQRToken = ownerSQRToken.connect(user2);
  const user3SQRToken = ownerSQRToken.connect(user3);
  const owner2SQRToken = ownerSQRToken.connect(owner2);
  const coldWalletSQRToken = ownerSQRToken.connect(coldWallet);

  return {
    sqrTokenAddress,
    ownerSQRToken,
    user1SQRToken,
    user2SQRToken,
    user3SQRToken,
    owner2SQRToken,
    coldWalletSQRToken,
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
      getContractArgs(
        deployData?.newOwner ?? '',
        deployData?.sqrToken ?? '',
        deployData?.coldWallet ?? '',
        deployData?.balanceLimit ?? BigInt(0),
      ),
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
  sqrTokenAddress: string,
  sqrPaymentGatewayAddress: string,
): Promise<ContextBase> {
  const users = await getUsers();
  const sqrTokenContext = await getSQRTokenContext(users, sqrTokenAddress);
  const sqrPaymentGatewayContext = await getSQRPaymentGatewayContext(
    users,
    sqrPaymentGatewayAddress,
  );

  return {
    ...users,
    ...sqrTokenContext,
    ...sqrPaymentGatewayContext,
  };
}
