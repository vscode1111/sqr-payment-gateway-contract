import { contractConfig } from '~seeds';
import { ContextBase } from '~types';
import { getSQRPaymentGatewayContext, getSQRTokenContext, getUsers } from '~utils';

export async function deploySQRPaymentGatewayContractFixture(): Promise<ContextBase> {
  const users = await getUsers();
  const { owner2Address, coldWalletAddress } = users;

  const sqrTokenContext = await getSQRTokenContext(users);
  const { sqrTokenAddress } = sqrTokenContext;

  const sqrPaymentGatewayContext = await getSQRPaymentGatewayContext(users, {
    newOwner: owner2Address,
    sqrToken: sqrTokenAddress,
    coldWallet: coldWalletAddress,
    balanceLimit: contractConfig.balanceLimit,
  });

  return {
    ...users,
    ...sqrTokenContext,
    ...sqrPaymentGatewayContext,
  };
}
