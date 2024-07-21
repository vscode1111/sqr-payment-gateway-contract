import { ContextBase } from '~types';
import { getERC20TokenContext } from './getERC20TokenContext';
import { getSQRPaymentGatewayContext } from './getSQRPaymentGatewayContext';
import { getUsers } from './getUsers';

export async function getContext(
  erc20TokenAddress: string,
  sqrPaymentGatewayAddress: string,
): Promise<ContextBase> {
  const users = await getUsers();
  const erc20TokenContext = await getERC20TokenContext(users, erc20TokenAddress);
  const sqrPaymentGatewayContext = await getSQRPaymentGatewayContext(
    users,
    sqrPaymentGatewayAddress,
  );

  return {
    ...users,
    ...erc20TokenContext,
    ...sqrPaymentGatewayContext,
  };
}
