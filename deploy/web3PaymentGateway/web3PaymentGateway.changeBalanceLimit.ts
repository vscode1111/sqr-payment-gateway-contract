import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, waitTx } from '~common-contract';
import { WEB3_PAYMENT_GATEWAY_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig } from '~seeds';
import { getAddressesFromHre, getContext } from '~utils';
import { deployData } from './deployData';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { web3PaymentGatewayAddress } = getAddressesFromHre(hre);
    console.log(
      `${WEB3_PAYMENT_GATEWAY_NAME} ${web3PaymentGatewayAddress} is withdrawing to user...`,
    );
    const erc20TokenAddress = contractConfig.erc20Token;
    const context = await getContext(erc20TokenAddress, web3PaymentGatewayAddress);
    const { owner2WEB3PaymentGateway } = context;

    const params = {
      balanceLimit: deployData.balanceLimit,
    };

    console.table(params);
    await waitTx(
      owner2WEB3PaymentGateway.changeBalanceLimit(params.balanceLimit, TX_OVERRIDES),
      'changeBalanceLimit',
    );
  }, hre);
};

func.tags = [`${WEB3_PAYMENT_GATEWAY_NAME}:change-balance-limit`];

export default func;
