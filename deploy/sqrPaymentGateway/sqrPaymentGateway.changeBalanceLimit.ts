import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, waitTx } from '~common-contract';
import { SQR_PAYMENT_GATEWAY_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig } from '~seeds';
import { getAddressesFromHre, getContext } from '~utils';
import { deployData } from './deployData';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrPaymentGatewayAddress } = getAddressesFromHre(hre);
    console.log(
      `${SQR_PAYMENT_GATEWAY_NAME} ${sqrPaymentGatewayAddress} is withdrawing to user...`,
    );
    const erc20TokenAddress = contractConfig.erc20Token;
    const context = await getContext(erc20TokenAddress, sqrPaymentGatewayAddress);
    const { owner2SQRPaymentGateway } = context;

    const params = {
      balanceLimit: deployData.balanceLimit,
    };

    console.table(params);
    await waitTx(
      owner2SQRPaymentGateway.changeBalanceLimit(params.balanceLimit, TX_OVERRIDES),
      'changeBalanceLimit',
    );
  }, hre);
};

func.tags = [`${SQR_PAYMENT_GATEWAY_NAME}:change-balance-limit`];

export default func;
