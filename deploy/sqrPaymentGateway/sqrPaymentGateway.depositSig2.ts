import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, toNumberDecimals, waitTx } from '~common';
import { SQR_PAYMENT_GATEWAY_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig, seedData } from '~seeds';
import { getAddressesFromHre, getContext, signMessageForDeposit } from '~utils';
import { deployData, deployParams } from './deployData';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrPaymentGatewayAddress } = getAddressesFromHre(hre);
    console.log(`${SQR_PAYMENT_GATEWAY_NAME} ${sqrPaymentGatewayAddress} is depositing...`);
    const erc20TokenAddress = contractConfig.erc20Token;
    const context = await getContext(erc20TokenAddress, sqrPaymentGatewayAddress);
    const {
      user2Address,
      user2ERC20Token,
      user2SQRPaymentGateway,
      sqrPaymentGatewayFactory,
      depositVerifier,
    } = context;

    const decimals = Number(await user2ERC20Token.decimals());

    const currentAllowance = await user2ERC20Token.allowance(
      user2Address,
      sqrPaymentGatewayAddress,
    );
    console.log(`${toNumberDecimals(currentAllowance, decimals)} tokens was allowed`);

    const userId = deployData.userId2;
    const nonce = await user2SQRPaymentGateway.getDepositNonce(userId);

    const params = {
      userId: deployData.userId2,
      transactionId: seedData.depositTransactionId2,
      amount: deployData.deposit2,
      account: user2Address,
      nonce: Number(nonce),
      timestampLimit: seedData.nowPlus1m,
      signature: '',
    };

    params.signature = await signMessageForDeposit(
      depositVerifier,
      params.userId,
      params.transactionId,
      params.account,
      params.amount,
      params.nonce,
      params.timestampLimit,
    );

    if (params.amount > currentAllowance) {
      const askAllowance = seedData.allowance;
      await waitTx(user2ERC20Token.approve(sqrPaymentGatewayAddress, askAllowance), 'approve');
      console.log(
        `${toNumberDecimals(
          askAllowance,
          decimals,
        )} SQR was approved to ${sqrPaymentGatewayAddress}`,
      );
    }

    console.table(params);

    await waitTx(
      user2SQRPaymentGateway.depositSig(
        params.userId,
        params.transactionId,
        params.account,
        params.amount,
        params.timestampLimit,
        params.signature,
        TX_OVERRIDES,
      ),
      'depositSig',
      deployParams.attempts,
      deployParams.delay,
      sqrPaymentGatewayFactory,
    );
  }, hre);
};

func.tags = [`${SQR_PAYMENT_GATEWAY_NAME}:deposit-sig2`];

export default func;
