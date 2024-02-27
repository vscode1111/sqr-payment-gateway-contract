import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, toNumberDecimals, waitTx } from '~common';
import { SQR_PAYMENT_GATEWAY_NAME } from '~constants';
import { contractConfig } from '~seeds';
import { getAddressesFromHre, getContext } from '~utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrPaymentGatewayAddress } = getAddressesFromHre(hre);
    console.log(`${SQR_PAYMENT_GATEWAY_NAME} ${sqrPaymentGatewayAddress} is withdrawing to user...`);
    const sqrTokenAddress = contractConfig.sqrToken;
    const context = await getContext(sqrTokenAddress, sqrPaymentGatewayAddress);
    const { user3Address, owner2SQRPaymentGateway, user1SQRToken } = context;

    const decimals = Number(await user1SQRToken.decimals());

    const amount = await owner2SQRPaymentGateway.getBalance();
    console.log(`${toNumberDecimals(amount, decimals)} SQR in contract`);

    const params = {
      token: sqrTokenAddress,
      to: user3Address,
      amount,
    };

    console.table(params);
    await waitTx(
      owner2SQRPaymentGateway.emergencyWithdraw(params.token, params.to, params.amount),
      'emergencyWithdraw',
    );
  }, hre);
};

func.tags = [`${SQR_PAYMENT_GATEWAY_NAME}:emergency-withdraw`];

export default func;
