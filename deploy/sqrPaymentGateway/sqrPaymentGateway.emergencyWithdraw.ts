import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, toNumberDecimals, waitTx } from '~common';
import { SQR_PAYMENT_GATEWAY_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig } from '~seeds';
import { getAddressesFromHre, getContext } from '~utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrPaymentGatewayAddress } = getAddressesFromHre(hre);
    console.log(
      `${SQR_PAYMENT_GATEWAY_NAME} ${sqrPaymentGatewayAddress} is withdrawing to user...`,
    );
    const erc20TokenAddress = contractConfig.erc20Token;
    const context = await getContext(erc20TokenAddress, sqrPaymentGatewayAddress);
    const { user3Address, owner2SQRPaymentGateway, user1ERC20Token } = context;

    const decimals = Number(await user1ERC20Token.decimals());

    const amount = await owner2SQRPaymentGateway.getBalance();
    console.log(`${toNumberDecimals(amount, decimals)} SQR in contract`);

    const params = {
      token: erc20TokenAddress,
      to: user3Address,
      amount,
    };

    console.table(params);
    await waitTx(
      owner2SQRPaymentGateway.forceWithdraw(params.token, params.to, params.amount, TX_OVERRIDES),
      'forceWithdraw',
    );
  }, hre);
};

func.tags = [`${SQR_PAYMENT_GATEWAY_NAME}:emergency-withdraw`];

export default func;
