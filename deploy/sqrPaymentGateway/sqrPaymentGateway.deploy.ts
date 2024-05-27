import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { MS_IN_SEC, sleep } from '~common';
import { callWithTimerHre, verifyContract } from '~common-contract';
import { SQR_PAYMENT_GATEWAY_NAME } from '~constants';
import { contractConfig } from '~seeds';
import { getSQRPaymentGatewayContext, getUsers } from '~utils';
import { verifyRequired } from './deployData';
import { formatContractConfig, getContractArgsEx } from './utils';

const pauseTime = 10;

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    console.log(`${SQR_PAYMENT_GATEWAY_NAME} is deploying...`);
    console.table(formatContractConfig(contractConfig));
    console.log(`Pause ${pauseTime} sec to make sure...`);
    await sleep(pauseTime * MS_IN_SEC);

    console.log(`Deploying...`);
    const { sqrPaymentGatewayAddress } = await getSQRPaymentGatewayContext(
      await getUsers(),
      contractConfig,
    );
    console.log(`${SQR_PAYMENT_GATEWAY_NAME} deployed to ${sqrPaymentGatewayAddress}`);
    if (verifyRequired) {
      await verifyContract(sqrPaymentGatewayAddress, hre, getContractArgsEx());
      console.log(
        `${SQR_PAYMENT_GATEWAY_NAME} deployed and verified to ${sqrPaymentGatewayAddress}`,
      );
    }
  }, hre);
};

func.tags = [`${SQR_PAYMENT_GATEWAY_NAME}:deploy`];

export default func;
