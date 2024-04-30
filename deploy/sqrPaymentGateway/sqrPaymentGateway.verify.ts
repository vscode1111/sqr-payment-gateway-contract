import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, verifyContract } from '~common';
import { SQR_PAYMENT_GATEWAY_NAME } from '~constants';
import { getAddressesFromHre } from '~utils';
import { getContractArgsEx } from './utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrPaymentGatewayAddress: erc20TokenAddress } = getAddressesFromHre(hre);
    console.log(`${SQR_PAYMENT_GATEWAY_NAME} ${erc20TokenAddress} is verify...`);
    await verifyContract(erc20TokenAddress, hre, getContractArgsEx());
  }, hre);
};

func.tags = [`${SQR_PAYMENT_GATEWAY_NAME}:verify`];

export default func;
