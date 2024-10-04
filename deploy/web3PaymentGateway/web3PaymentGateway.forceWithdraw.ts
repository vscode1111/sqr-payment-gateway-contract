import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { toNumberDecimals } from '~common';
import { callWithTimerHre, waitTx } from '~common-contract';
import { WEB3_PAYMENT_GATEWAY_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig } from '~seeds';
import { getAddressesFromHre, getContext } from '~utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { web3PaymentGatewayAddress } = getAddressesFromHre(hre);
    console.log(
      `${WEB3_PAYMENT_GATEWAY_NAME} ${web3PaymentGatewayAddress} is withdrawing to user...`,
    );
    const erc20TokenAddress = contractConfig.erc20Token;
    const context = await getContext(erc20TokenAddress, web3PaymentGatewayAddress);
    const { user3Address, owner2WEB3PaymentGateway, user1ERC20Token } = context;

    const decimals = Number(await user1ERC20Token.decimals());

    const amount = await owner2WEB3PaymentGateway.getBalance();
    console.log(`${toNumberDecimals(amount, decimals)} WEB3 in contract`);

    const params = {
      token: erc20TokenAddress,
      to: user3Address,
      amount,
    };

    console.table(params);
    await waitTx(
      owner2WEB3PaymentGateway.forceWithdraw(params.token, params.to, params.amount, TX_OVERRIDES),
      'forceWithdraw',
    );
  }, hre);
};

func.tags = [`${WEB3_PAYMENT_GATEWAY_NAME}:force-withdraw`];

export default func;
