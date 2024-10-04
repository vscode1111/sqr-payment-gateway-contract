import { ContextBase } from '~types';
import { getERC20TokenContext } from './getERC20TokenContext';
import { getWEB3PaymentGatewayContext } from './getWEB3PaymentGatewayContext';
import { getUsers } from './getUsers';

export async function getContext(
  erc20TokenAddress: string,
  web3PaymentGatewayAddress: string,
): Promise<ContextBase> {
  const users = await getUsers();
  const erc20TokenContext = await getERC20TokenContext(users, erc20TokenAddress);
  const web3PaymentGatewayContext = await getWEB3PaymentGatewayContext(
    users,
    web3PaymentGatewayAddress,
  );

  return {
    ...users,
    ...erc20TokenContext,
    ...web3PaymentGatewayContext,
  };
}
