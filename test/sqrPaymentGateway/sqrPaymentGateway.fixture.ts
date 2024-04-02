import { contractConfig } from '~seeds';
import { ContextBase } from '~types';
import { getERC20TokenContext, getSQRPaymentGatewayContext, getUsers } from '~utils';

export async function deploySQRPaymentGatewayContractFixture(): Promise<ContextBase> {
  const users = await getUsers();
  const { owner2Address, coldWalletAddress } = users;

  const erc20TokenContext = await getERC20TokenContext(users);
  const { erc20TokenAddress } = erc20TokenContext;

  const sqrPaymentGatewayContext = await getSQRPaymentGatewayContext(users, {
    newOwner: owner2Address,
    erc20Token: erc20TokenAddress,
    coldWallet: coldWalletAddress,
    depositGoal: contractConfig.depositGoal,
    startDate: contractConfig.startDate,
    closeDate: contractConfig.closeDate,
    withdrawGoal: contractConfig.withdrawGoal,
    balanceLimit: contractConfig.balanceLimit,
  });

  return {
    ...users,
    ...erc20TokenContext,
    ...sqrPaymentGatewayContext,
  };
}
