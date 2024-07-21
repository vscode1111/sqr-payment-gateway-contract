import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, printDate, printToken } from '~common-contract';
import { SQR_PAYMENT_GATEWAY_NAME } from '~constants';
import {
  getAddressesFromHre,
  getERC20TokenContext,
  getSQRPaymentGatewayContext,
  getUsers,
} from '~utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrPaymentGatewayAddress } = await getAddressesFromHre(hre);
    console.log(`${SQR_PAYMENT_GATEWAY_NAME} ${sqrPaymentGatewayAddress} is fetching...`);
    const users = await getUsers();
    const { ownerSQRPaymentGateway } = await getSQRPaymentGatewayContext(
      users,
      sqrPaymentGatewayAddress,
    );

    const erc20Token = await ownerSQRPaymentGateway.erc20Token();
    const { ownerERC20Token } = await getERC20TokenContext(users, erc20Token);
    const decimals = Number(await ownerERC20Token.decimals());
    const tokenName = await ownerERC20Token.name();

    const result = {
      owner: await ownerSQRPaymentGateway.owner(),
      erc20Token,
      depositVerifier: await ownerSQRPaymentGateway.depositVerifier(),
      depositGoal: printToken(await ownerSQRPaymentGateway.depositGoal(), decimals, tokenName),
      withdrawVerifier: await ownerSQRPaymentGateway.withdrawVerifier(),
      withdrawGoal: printToken(await ownerSQRPaymentGateway.withdrawGoal(), decimals, tokenName),
      startDate: printDate(await ownerSQRPaymentGateway.startDate()),
      closeDate: printDate(await ownerSQRPaymentGateway.closeDate()),
      coldWallet: await ownerSQRPaymentGateway.coldWallet(),
      balanceLimit: printToken(await ownerSQRPaymentGateway.balanceLimit(), decimals, tokenName),
      balance: printToken(await ownerSQRPaymentGateway.getBalance(), decimals, tokenName),
      totalDeposited: printToken(
        await ownerSQRPaymentGateway.totalDeposited(),
        decimals,
        tokenName,
      ),
      isDepositReady: await ownerSQRPaymentGateway.isDepositReady(),
      isFetchReady: await ownerSQRPaymentGateway.getDepositRefundFetchReady(),
    };

    console.table(result);

    const userFundItem = await ownerSQRPaymentGateway.fetchUserFundItem(
      'f80f623b-4e53-4769-9fe7-93d0901c7261',
    );
    console.log(userFundItem);
    const depositNonce = await ownerSQRPaymentGateway.getDepositNonce(users.user2Address);
    console.log(depositNonce);
  }, hre);
};

func.tags = [`${SQR_PAYMENT_GATEWAY_NAME}:fetch`];

export default func;
