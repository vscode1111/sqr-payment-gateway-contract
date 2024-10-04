import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, waitTx } from '~common-contract';
import { WEB3_PAYMENT_GATEWAY_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig } from '~seeds';
import { getAddressesFromHre, getContext } from '~utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { web3PaymentGatewayAddress } = getAddressesFromHre(hre);
    console.log(
      `${WEB3_PAYMENT_GATEWAY_NAME} ${web3PaymentGatewayAddress} is transferring ownership ...`,
    );
    const erc20TokenAddress = contractConfig.erc20Token;
    const { owner2WEB3PaymentGateway } = await getContext(
      erc20TokenAddress,
      web3PaymentGatewayAddress,
    );

    const params = {
      newOwner: '0xA8B8455ad9a1FAb1d4a3B69eD30A52fBA82549Bb',
    };

    console.table(params);
    await waitTx(
      owner2WEB3PaymentGateway.transferOwnership(params.newOwner, TX_OVERRIDES),
      'transferOwnership',
    );
  }, hre);
};

func.tags = [`${WEB3_PAYMENT_GATEWAY_NAME}:transfer-ownership`];

export default func;
