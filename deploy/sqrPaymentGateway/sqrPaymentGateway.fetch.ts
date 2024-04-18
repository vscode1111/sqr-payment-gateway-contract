import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre } from '~common';
import { SQR_PAYMENT_GATEWAY_NAME } from '~constants';
import { getAddressesFromHre, getSQRPaymentGatewayContext, getUsers } from '~utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrPaymentGatewayAddress } = await getAddressesFromHre(hre);
    console.log(`${SQR_PAYMENT_GATEWAY_NAME} ${sqrPaymentGatewayAddress} is fetching...`);
    const users = await getUsers();
    const { ownerSQRPaymentGateway } = await getSQRPaymentGatewayContext(
      users,
      sqrPaymentGatewayAddress,
    );

    const result = {
      owner: await ownerSQRPaymentGateway.owner(),
      erc20Token: await ownerSQRPaymentGateway.erc20Token(),
      coldWallet: await ownerSQRPaymentGateway.coldWallet(),
      balanceLimit: await ownerSQRPaymentGateway.balanceLimit(),
      balance: await ownerSQRPaymentGateway.getBalance(),
    };

    console.table(result);

    const fundItem = await ownerSQRPaymentGateway.fetchFundItem(
      'f80f623b-4e53-4769-9fe7-93d0901c7261',
    );
    console.log(fundItem);
  }, hre);
};

func.tags = [`${SQR_PAYMENT_GATEWAY_NAME}:fetch`];

export default func;
