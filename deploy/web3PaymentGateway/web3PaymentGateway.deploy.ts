import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { MS_IN_SEC, sleep } from '~common';
import { callWithTimerHre, verifyContract } from '~common-contract';
import { CONTRACT_NAME, CONTRACT_VERSION, WEB3_PAYMENT_GATEWAY_NAME } from '~constants';
import { contractConfig } from '~seeds';
import { getWEB3PaymentGatewayContext, getUsers } from '~utils';
import { verifyRequired } from './deployData';
import { formatContractConfig, getContractArgsEx } from './utils';

const pauseTime = 10;

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    console.log(`${WEB3_PAYMENT_GATEWAY_NAME} is deploying...`);
    console.log(`${CONTRACT_NAME} v${CONTRACT_VERSION}`);
    console.table(formatContractConfig(contractConfig));
    console.log(`Pause ${pauseTime} sec to make sure...`);
    await sleep(pauseTime * MS_IN_SEC);

    console.log(`Deploying...`);
    const { web3PaymentGatewayAddress } = await getWEB3PaymentGatewayContext(
      await getUsers(),
      contractConfig,
    );
    console.log(`${WEB3_PAYMENT_GATEWAY_NAME} deployed to ${web3PaymentGatewayAddress}`);
    if (verifyRequired) {
      await verifyContract(web3PaymentGatewayAddress, hre, getContractArgsEx());
      console.log(
        `${WEB3_PAYMENT_GATEWAY_NAME} deployed and verified to ${web3PaymentGatewayAddress}`,
      );
    }
  }, hre);
};

func.tags = [`${WEB3_PAYMENT_GATEWAY_NAME}:deploy`];

export default func;
