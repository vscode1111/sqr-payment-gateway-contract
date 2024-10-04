import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { toNumberDecimals } from '~common';
import { callWithTimerHre, waitTx } from '~common-contract';
import { WEB3_PAYMENT_GATEWAY_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig, seedData } from '~seeds';
import { getAddressesFromHre, getContext, signMessageForWEB3PaymentGatewayDeposit } from '~utils';
import { deployData, deployParams } from './deployData';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { web3PaymentGatewayAddress } = getAddressesFromHre(hre);
    console.log(`${WEB3_PAYMENT_GATEWAY_NAME} ${web3PaymentGatewayAddress} is depositing...`);
    const erc20TokenAddress = contractConfig.erc20Token;
    const context = await getContext(erc20TokenAddress, web3PaymentGatewayAddress);
    const {
      depositVerifier,
      user1Address,
      user1ERC20Token,
      user1WEB3PaymentGateway,
      web3PaymentGatewayFactory,
    } = context;

    const decimals = Number(await user1ERC20Token.decimals());

    const currentAllowance = await user1ERC20Token.allowance(
      user1Address,
      web3PaymentGatewayAddress,
    );
    console.log(`${toNumberDecimals(currentAllowance, decimals)} token was allowed`);

    const userId = deployData.userId1;
    const nonce = await user1WEB3PaymentGateway.getDepositNonce(userId);

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

    params.signature = await signMessageForWEB3PaymentGatewayDeposit(
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
        user1ERC20Token.approve(web3PaymentGatewayAddress, askAllowance, TX_OVERRIDES),
        'approve',
      );
      console.log(
        `${toNumberDecimals(
          askAllowance,
          decimals,
        )} WEB3 was approved to ${web3PaymentGatewayAddress}`,
      );
    }

    console.table(params);

    const gas = await user1WEB3PaymentGateway.depositSig.estimateGas(
      params.userId,
      params.transactionId,
      params.account,
      params.amount,
      params.timestampLimit,
      params.signature,
    );
    console.log(111, gas);

    await waitTx(
      user1WEB3PaymentGateway.depositSig(
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
      web3PaymentGatewayFactory,
    );
  }, hre);
};

func.tags = [`${WEB3_PAYMENT_GATEWAY_NAME}:deposit-sig1`];

export default func;
