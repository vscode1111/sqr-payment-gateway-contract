import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getNetworkName } from '~common-contract';
import { CONTRACTS } from '~constants';
import { Addresses, DeployNetworks } from '~types';

export function getAddresses(network: keyof DeployNetworks): Addresses {
  const sqrPaymentGatewayAddress = CONTRACTS.SQR_PAYMENT_GATEWAY[network];
  return {
    sqrPaymentGatewayAddress,
  };
}

export function getAddressesFromHre(hre: HardhatRuntimeEnvironment) {
  return getAddresses(getNetworkName(hre));
}
