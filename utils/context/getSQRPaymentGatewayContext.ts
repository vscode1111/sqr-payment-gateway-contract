import { DeployProxyOptions } from '@openzeppelin/hardhat-upgrades/dist/utils';
import { ethers, upgrades } from 'hardhat';
import { SQR_PAYMENT_GATEWAY_NAME, TX_OVERRIDES } from '~constants';
import { ContractConfig, getContractArgs } from '~seeds';
import { SQRPaymentGateway } from '~typechain-types/contracts/SQRPaymentGateway';
import { SQRPaymentGateway__factory } from '~typechain-types/factories/contracts/SQRPaymentGateway__factory';
import { SQRPaymentGatewayContext, Users } from '~types';

const OPTIONS: DeployProxyOptions = {
  initializer: 'initialize',
  kind: 'uups',
  txOverrides: TX_OVERRIDES,
};

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
    owner2SqrPaymentGatewayFactory,
    sqrPaymentGatewayAddress,
    ownerSQRPaymentGateway,
    user1SQRPaymentGateway,
    user2SQRPaymentGateway,
    user3SQRPaymentGateway,
    owner2SQRPaymentGateway,
    coldWalletSQRPaymentGateway,
  };
}
