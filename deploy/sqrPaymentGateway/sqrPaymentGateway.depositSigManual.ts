import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { toNumberDecimals } from '~common';
import { callWithTimerHre, waitTx } from '~common-contract';
import { SQR_PAYMENT_GATEWAY_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig, seedData } from '~seeds';
import {
  getAddressesFromHre,
  getContext,
  signMessageForSQRPaymentGatewayDeposit as signMessageForPaymentGatewayDeposit,
} from '~utils';
import { deployParams } from './deployData';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrPaymentGatewayAddress } = getAddressesFromHre(hre);
    console.log(`${SQR_PAYMENT_GATEWAY_NAME} ${sqrPaymentGatewayAddress} is depositing...`);
    const erc20TokenAddress = contractConfig.erc20Token;
    console.log(`Token address ${erc20TokenAddress}`);
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
    console.log(`${toNumberDecimals(currentAllowance, decimals)} tokens was allowed`);

    //From Postman
    const body = {
      contractAddress: '0x5696fa3DD95486590dAE95b9070b0760eF57BfCe',
      userId: 'tu1-f75c73b1-0f13-46ae-88f8-2048765c5ad4',
      transactionId: '62813e9b-bde7-40bf-adde-4cf3c3d76002+05',
      account: '0xc109D9a3Fc3779db60af4821AE18747c708Dfcc6',
      amount: 0.0056811126839198423234,
    };

    const response = {
      signature:
        '0x69f4cb7564bcd4a89f5f94c25f2f605b746e3c0abd737ed16d309a2bf12277110f077e6c575cb3890952143011764374e15f4c8f0db5bcb081c5f2d1f42dfee61c',
      amountInWei: '568111',
      nonce: 0,
      timestampNow: 1721813741,
      timestampLimit: 1721814041,
      dateLimit: '2024-07-24T09:45:43.254Z',
    };

    //Checks
    const account = body.account.toLowerCase();

    if (body.contractAddress.toLowerCase() !== sqrPaymentGatewayAddress.toLowerCase()) {
      console.error(`Contract address is not correct`);
      return;
    }

    if (body.account.toLowerCase() !== user1Address.toLowerCase()) {
      console.error(`Account is not correct`);
      return;
    }

    const balance = await user1ERC20Token.balanceOf(account);
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

    const signature = await signMessageForPaymentGatewayDeposit(
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

func.tags = [`${SQR_PAYMENT_GATEWAY_NAME}:deposit-sig-manual`];

export default func;
