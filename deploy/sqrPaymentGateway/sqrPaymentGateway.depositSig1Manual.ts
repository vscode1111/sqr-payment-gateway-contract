import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, toNumberDecimals, waitTx } from '~common';
import { SQR_PAYMENT_GATEWAY_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig, seedData } from '~seeds';
import { getAddressesFromHre, getContext, signMessageForDeposit } from '~utils';
import { deployParams } from './deployData';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrPaymentGatewayAddress } = getAddressesFromHre(hre);
    console.log(`${SQR_PAYMENT_GATEWAY_NAME} ${sqrPaymentGatewayAddress} is depositing...`);
    const erc20TokenAddress = contractConfig.erc20Token;
    const context = await getContext(erc20TokenAddress, sqrPaymentGatewayAddress);
    const {
      depositVerifier,
      user1Address,
      user2ERC20Token,
      user1SQRPaymentGateway,
      sqrPaymentGatewayFactory,
    } = context;

    const decimals = Number(await user2ERC20Token.decimals());

    const currentAllowance = await user2ERC20Token.allowance(
      user1Address,
      sqrPaymentGatewayAddress,
    );
    console.log(`${toNumberDecimals(currentAllowance, decimals)} tokens was allowed`);

    //From Postman
    const body = {
      contractType: 'fcfs',
      // "contractAddress": "0x57c11ef0f8fDbdc376444DE64a03d488BD3b09B8",
      contractAddress: '0x5D27C778759e078BBe6D11A6cd802E41459Fe852',
      userId: 'tu1-f75c73b1-0f13-46ae-88f8-2048765c5ad4',
      transactionId: '62813e9b-bde7-40bf-adde-4cf3c3d76002+20',
      account: '0xc109D9a3Fc3779db60af4821AE18747c708Dfcc6',
      // "amount": 0.1234567890123456789
      amount: 0.002,
      // "amount": 0.123456789
    };

    const account = body.account.toLowerCase();

    const response = {
      signature:
        '0xa65a07780fea87006c42c7f602d08d8a7104fea9d716e2f2a327313ed150477f1f3aca0f2a36759f7320ae718b1f9e28d17dec17641605a1a07470e86a99c88c1c',
      amountInWei: '200000',
      nonce: 11,
      timestampNow: 1716299709,
      timestampLimit: 1716300129,
      dateLimit: '2024-05-21T14:03:14.398Z',
    };
    //Checks
    if (body.account.toLowerCase() !== user1Address.toLowerCase()) {
      console.error(`Account is not correct`);
      return;
    }

    const balance = await user2ERC20Token.balanceOf(account);
    console.log(`User balance: ${toNumberDecimals(balance, decimals)}`);
    if (Number(response.amountInWei) > Number(balance)) {
      console.error(`User balance is lower`);
      return;
    }

    const nonce = await user1SQRPaymentGateway.getDepositNonce(body.userId);
    console.log(`User nonce: ${nonce}`);
    if (response.nonce !== Number(nonce)) {
      console.error(`Nonce is not correct`);
      // return;
    }

    const signature = await signMessageForDeposit(
      depositVerifier,
      body.userId,
      body.transactionId,
      account,
      BigInt(response.amountInWei),
      response.nonce,
      response.timestampLimit,
    );

    if (response.signature !== signature) {
      console.error(`Signature is not correct`);
      return;
    }

    const params = {
      userId: body.userId,
      transactionId: body.transactionId,
      account,
      amount: BigInt(response.amountInWei),
      timestampLimit: response.timestampLimit,
      signature: response.signature,
    };

    if (params.amount > currentAllowance) {
      const askAllowance = seedData.allowance;
      await waitTx(
        user2ERC20Token.approve(sqrPaymentGatewayAddress, askAllowance, TX_OVERRIDES),
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

    // return;

    await waitTx(
      user1SQRPaymentGateway.depositSig(
        params.userId,
        params.transactionId,
        account,
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

func.tags = [`${SQR_PAYMENT_GATEWAY_NAME}:deposit-sig1-manual`];

export default func;
