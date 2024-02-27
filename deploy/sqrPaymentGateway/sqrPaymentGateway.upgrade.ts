import { upgrades } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, verifyContract } from '~common';
import { SQR_PAYMENT_GATEWAY_NAME } from '~constants';
import { getAddressesFromHre, getSQRPaymentGatewayContext, getUsers } from '~utils';
import { verifyRequired } from './deployData';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrPaymentGatewayAddress } = getAddressesFromHre(hre);
    console.log(`${SQR_PAYMENT_GATEWAY_NAME} ${sqrPaymentGatewayAddress} is upgrading...`);
    const { owner2SqrPaymentGatewayFactory } = await getSQRPaymentGatewayContext(
      await getUsers(),
      sqrPaymentGatewayAddress,
    );
    await upgrades.upgradeProxy(sqrPaymentGatewayAddress, owner2SqrPaymentGatewayFactory);
    console.log(`${SQR_PAYMENT_GATEWAY_NAME} upgraded to ${sqrPaymentGatewayAddress}`);
    if (verifyRequired) {
      await verifyContract(sqrPaymentGatewayAddress, hre);
      console.log(
        `${SQR_PAYMENT_GATEWAY_NAME} upgraded and verified to ${sqrPaymentGatewayAddress}`,
      );
    }
  }, hre);
};

func.tags = [`${SQR_PAYMENT_GATEWAY_NAME}:upgrade`];

export default func;
