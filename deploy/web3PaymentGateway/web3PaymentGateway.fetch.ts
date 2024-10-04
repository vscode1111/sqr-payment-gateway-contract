import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, printDate, printToken } from '~common-contract';
import { WEB3_PAYMENT_GATEWAY_NAME } from '~constants';
import {
  getAddressesFromHre,
  getERC20TokenContext,
  getWEB3PaymentGatewayContext,
  getUsers,
} from '~utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { web3PaymentGatewayAddress } = await getAddressesFromHre(hre);
    console.log(`${WEB3_PAYMENT_GATEWAY_NAME} ${web3PaymentGatewayAddress} is fetching...`);
    const users = await getUsers();
    const { ownerWEB3PaymentGateway } = await getWEB3PaymentGatewayContext(
      users,
      web3PaymentGatewayAddress,
    );

    const erc20Token = await ownerWEB3PaymentGateway.erc20Token();
    const { ownerERC20Token } = await getERC20TokenContext(users, erc20Token);
    const decimals = Number(await ownerERC20Token.decimals());
    const tokenName = await ownerERC20Token.name();

    const result = {
      owner: await ownerWEB3PaymentGateway.owner(),
      erc20Token,
      depositVerifier: await ownerWEB3PaymentGateway.depositVerifier(),
      depositGoal: printToken(await ownerWEB3PaymentGateway.depositGoal(), decimals, tokenName),
      withdrawVerifier: await ownerWEB3PaymentGateway.withdrawVerifier(),
      withdrawGoal: printToken(await ownerWEB3PaymentGateway.withdrawGoal(), decimals, tokenName),
      startDate: printDate(await ownerWEB3PaymentGateway.startDate()),
      closeDate: printDate(await ownerWEB3PaymentGateway.closeDate()),
      coldWallet: await ownerWEB3PaymentGateway.coldWallet(),
      balanceLimit: printToken(await ownerWEB3PaymentGateway.balanceLimit(), decimals, tokenName),
      balance: printToken(await ownerWEB3PaymentGateway.getBalance(), decimals, tokenName),
      totalDeposited: printToken(
        await ownerWEB3PaymentGateway.totalDeposited(),
        decimals,
        tokenName,
      ),
      isDepositReady: await ownerWEB3PaymentGateway.isDepositReady(),
      isReachedDepositGoal: await ownerWEB3PaymentGateway.isReachedDepositGoal(),
      isWithdrawReady: await ownerWEB3PaymentGateway.isWithdrawReady(),
      isReachedWithdrawGoal: await ownerWEB3PaymentGateway.isReachedWithdrawGoal(),
      isFetchReady: await ownerWEB3PaymentGateway.getDepositRefundFetchReady(),
    };

    console.table(result);

    const userFundItem = await ownerWEB3PaymentGateway.fetchUserFundItem(
      'f80f623b-4e53-4769-9fe7-93d0901c7261',
    );
    console.log(userFundItem);
    const depositNonce = await ownerWEB3PaymentGateway.getDepositNonce(users.user2Address);
    console.log(depositNonce);
  }, hre);
};

func.tags = [`${WEB3_PAYMENT_GATEWAY_NAME}:fetch`];

export default func;
