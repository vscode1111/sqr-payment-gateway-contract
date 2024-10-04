import { DeployProxyOptions } from '@openzeppelin/hardhat-upgrades/dist/utils';
import { ethers, upgrades } from 'hardhat';
import { WEB3_PAYMENT_GATEWAY_NAME, TX_OVERRIDES } from '~constants';
import { ContractConfig, getContractArgs } from '~seeds';
import { WEB3PaymentGateway } from '~typechain-types/contracts/WEB3PaymentGateway';
import { WEB3PaymentGateway__factory } from '~typechain-types/factories/contracts/WEB3PaymentGateway__factory';
import { WEB3PaymentGatewayContext, Users } from '~types';

const OPTIONS: DeployProxyOptions = {
  initializer: 'initialize',
  kind: 'uups',
  txOverrides: TX_OVERRIDES,
};

export async function getWEB3PaymentGatewayContext(
  users: Users,
  deployData?: string | ContractConfig,
): Promise<WEB3PaymentGatewayContext> {
  const { owner, user1, user2, user3, owner2, coldWallet } = users;

  const web3PaymentGatewayFactory = (await ethers.getContractFactory(
    WEB3_PAYMENT_GATEWAY_NAME,
  )) as unknown as WEB3PaymentGateway__factory;
  const owner2Web3PaymentGatewayFactory = (await ethers.getContractFactory(
    WEB3_PAYMENT_GATEWAY_NAME,
    owner2,
  )) as unknown as WEB3PaymentGateway__factory;

  let ownerWEB3PaymentGateway: WEB3PaymentGateway;

  if (typeof deployData === 'string') {
    ownerWEB3PaymentGateway = web3PaymentGatewayFactory
      .connect(owner)
      .attach(deployData) as WEB3PaymentGateway;
  } else {
    ownerWEB3PaymentGateway = (await upgrades.deployProxy(
      web3PaymentGatewayFactory,
      getContractArgs(deployData as ContractConfig),
      OPTIONS,
    )) as unknown as WEB3PaymentGateway;
  }

  const web3PaymentGatewayAddress = await ownerWEB3PaymentGateway.getAddress();

  const user1WEB3PaymentGateway = ownerWEB3PaymentGateway.connect(user1);
  const user2WEB3PaymentGateway = ownerWEB3PaymentGateway.connect(user2);
  const user3WEB3PaymentGateway = ownerWEB3PaymentGateway.connect(user3);
  const owner2WEB3PaymentGateway = ownerWEB3PaymentGateway.connect(owner2);
  const coldWalletWEB3PaymentGateway = ownerWEB3PaymentGateway.connect(coldWallet);

  return {
    web3PaymentGatewayFactory,
    owner2Web3PaymentGatewayFactory,
    web3PaymentGatewayAddress,
    ownerWEB3PaymentGateway,
    user1WEB3PaymentGateway,
    user2WEB3PaymentGateway,
    user3WEB3PaymentGateway,
    owner2WEB3PaymentGateway,
    coldWalletWEB3PaymentGateway,
  };
}
