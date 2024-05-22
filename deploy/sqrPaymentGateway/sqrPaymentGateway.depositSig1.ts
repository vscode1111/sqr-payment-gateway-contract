import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { toNumberDecimals } from '~common';
import { callWithTimerHre, waitTx } from '~common-contract';
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
      depositVerifier,
      user1Address,
      user1ERC20Token,
      user1SQRPaymentGateway,
      sqrPaymentGatewayFactory,
    } = context;

    const decimals = Number(await user1ERC20Token.decimals());

    const currentAllowance = await user1ERC20Token.allowance(
      user1Address,
      sqrPaymentGatewayAddress,
    );
    console.log(`${toNumberDecimals(currentAllowance, decimals)} token was allowed`);

    const userId = deployData.userId1;
    const nonce = await user1SQRPaymentGateway.getDepositNonce(userId);

    const params = {
      userId,
      transactionId: seedData.depositTransactionId1,
      account: user1Address,
      amount: deployData.deposit1,
      // amount: seedData.extraDeposit1,
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
      await waitTx(
        user1ERC20Token.approve(sqrPaymentGatewayAddress, askAllowance, TX_OVERRIDES),
        'approve',
      );
      console.log(
        `${toNumberDecimals(
          askAllowance,
          decimals,
        )} SQR was approved to ${sqrPaymentGatewayAddress}`,
      );
    }

    console.table(params);

    await waitTx(
      user1SQRPaymentGateway.depositSig(
        params.userId,
        params.transactionId,
        params.account,
        params.amount,
        params.timestampLimit,
        params.signature,
      ),
      'depositSig',
      deployParams.attempts,
      deployParams.delay,
      sqrPaymentGatewayFactory,
    );
  }, hre);
};

func.tags = [`${SQR_PAYMENT_GATEWAY_NAME}:deposit-sig1`];

export default func;
