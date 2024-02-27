import { expect } from 'chai';
import { ZeroAddress } from 'ethers';
import { waitTx } from '~common';
import { contractConfig, seedData } from '~seeds';
import { getSQRPaymentGatewayContext, getUsers } from '~utils';
import { ChangeBalanceLimitArgs, errorMessage } from '.';
import { findEvent } from './utils';

export function shouldBehaveCorrectControl(): void {
  describe('control', () => {
    it('user1 tries to change balanceLimit', async function () {
      await expect(this.user1SQRPaymentGateway.changeBalanceLimit(seedData.balanceLimit)).revertedWith(
        errorMessage.onlyOwner,
      );
    });

    it('owner2 changes balanceLimit', async function () {
      await this.owner2SQRPaymentGateway.changeBalanceLimit(seedData.balanceLimit);

      const receipt = await waitTx(this.owner2SQRPaymentGateway.changeBalanceLimit(seedData.balanceLimit));
      const eventLog = findEvent<ChangeBalanceLimitArgs>(receipt);
      expect(eventLog).not.undefined;
      const [account, amount] = eventLog?.args;
      expect(account).eq(this.owner2Address);
      expect(amount).eq(seedData.balanceLimit);

      expect(await this.owner2SQRPaymentGateway.balanceLimit()).eq(seedData.balanceLimit);
    });

    it('owner tries to deploy with zero new owner address', async function () {
      const users = await getUsers();
      await expect(
        getSQRPaymentGatewayContext(users, {
          ...contractConfig,
          newOwner: ZeroAddress,
        }),
      ).revertedWith(errorMessage.newOwnerAddressCantBeZero);
    });

    it('owner tries to deploy with zero SQR token address', async function () {
      const users = await getUsers();
      await expect(
        getSQRPaymentGatewayContext(users, {
          ...contractConfig,
          sqrToken: ZeroAddress,
        }),
      ).revertedWith(errorMessage.sqrTokeAddressCantBeZero);
    });

    it('owner tries to deploy with zero cold wallet address', async function () {
      const users = await getUsers();
      await expect(
        getSQRPaymentGatewayContext(users, {
          ...contractConfig,
          coldWallet: ZeroAddress,
        }),
      ).revertedWith(errorMessage.coldWalletAddressCantBeZero);
    });
  });
}
