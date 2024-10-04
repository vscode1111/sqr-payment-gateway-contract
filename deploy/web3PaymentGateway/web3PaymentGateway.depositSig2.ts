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
      user2Address,
      user2ERC20Token,
      user2WEB3PaymentGateway,
      web3PaymentGatewayFactory,
      depositVerifier,
    } = context;

    const decimals = Number(await user2ERC20Token.decimals());

    const currentAllowance = await user2ERC20Token.allowance(
      user2Address,
      web3PaymentGatewayAddress,
    );
    console.log(`${toNumberDecimals(currentAllowance, decimals)} tokens was allowed`);

    const userId = deployData.userId2;
    const nonce = await user2WEB3PaymentGateway.getDepositNonce(userId);

    const params = {
      userId: deployData.userId2,
      transactionId: seedData.depositTransactionId2_0,
      amount: deployData.deposit2,
      account: user2Address,
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
      await waitTx(user2ERC20Token.approve(web3PaymentGatewayAddress, askAllowance), 'approve');
      console.log(
        `${toNumberDecimals(
          askAllowance,
          decimals,
        )} WEB3 was approved to ${web3PaymentGatewayAddress}`,
      );
    }

    console.table(params);

    await waitTx(
      user2WEB3PaymentGateway.depositSig(
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
      web3PaymentGatewayFactory,
    );
  }, hre);
};

func.tags = [`${WEB3_PAYMENT_GATEWAY_NAME}:deposit-sig2`];

export default func;
