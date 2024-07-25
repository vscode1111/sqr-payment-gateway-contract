import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, waitTx } from '~common-contract';
import { SQR_PAYMENT_GATEWAY_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig } from '~seeds';
import { getAddressesFromHre, getContext } from '~utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrPaymentGatewayAddress } = getAddressesFromHre(hre);
    console.log(
      `${SQR_PAYMENT_GATEWAY_NAME} ${sqrPaymentGatewayAddress} is transferring ownership ...`,
    );
    const erc20TokenAddress = contractConfig.erc20Token;
    const { owner2SQRPaymentGateway } = await getContext(
      erc20TokenAddress,
      sqrPaymentGatewayAddress,
    );

    const params = {
      newOwner: '0xA8B8455ad9a1FAb1d4a3B69eD30A52fBA82549Bb',
    };

    console.table(params);
    await waitTx(
      owner2SQRPaymentGateway.transferOwnership(params.newOwner, TX_OVERRIDES),
      'transferOwnership',
    );
  }, hre);
};

func.tags = [`${SQR_PAYMENT_GATEWAY_NAME}:transfer-ownership`];

export default func;
