import { expect } from 'chai';
import { Dayjs } from 'dayjs';
import { ZeroAddress } from 'ethers';
import { waitTx } from '~common';
import { MAX_INT, ZERO } from '~constants';
import { contractConfig, seedData } from '~seeds';
import {
  addSecondsToUnixTime,
  getSQRPaymentGatewayContext,
  getUsers,
  signMessageForDeposit,
  signMessageForWithdraw,
} from '~utils';
import { ChangeBalanceLimitArgs, customError } from '.';
import { findEvent, loadSQRPaymentGatewayFixture } from './utils';

export function shouldBehaveCorrectDeployment(): void {
  describe('deployment', () => {
    let chainTime: Dayjs;

    beforeEach(async function () {
      await loadSQRPaymentGatewayFixture(this, undefined, async (_chainTime, config) => {
        chainTime = _chainTime;
        return config;
      });
    });

    it('user1 tries to change balanceLimit', async function () {
      await expect(this.user1SQRPaymentGateway.changeBalanceLimit(seedData.balanceLimit))
        .revertedWithCustomError(
          this.user1SQRPaymentGateway,
          customError.ownableUnauthorizedAccount,
        )
        .withArgs(this.user1Address);
    });

    it('owner2 changes balanceLimit', async function () {
      await this.owner2SQRPaymentGateway.changeBalanceLimit(seedData.balanceLimit);

      const receipt = await waitTx(
        this.owner2SQRPaymentGateway.changeBalanceLimit(seedData.balanceLimit),
      );
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
      ).revertedWithCustomError(this.owner2SQRPaymentGateway, customError.newOwnerNotZeroAddress);
    });

    it('owner tries to deploy with zero ERC20 token address', async function () {
      const users = await getUsers();
      await expect(
        getSQRPaymentGatewayContext(users, {
          ...contractConfig,
          erc20Token: ZeroAddress,
        }),
      ).revertedWithCustomError(this.owner2SQRPaymentGateway, customError.erc20TokenNotZeroAddress);
    });

    it('owner tries to deploy when start date is later than close one', async function () {
      const users = await getUsers();
      await expect(
        getSQRPaymentGatewayContext(users, {
          ...contractConfig,
          startDate: addSecondsToUnixTime(chainTime, 10),
          closeDate: addSecondsToUnixTime(chainTime, 9),
        }),
      ).revertedWithCustomError(
        this.owner2SQRPaymentGateway,
        customError.closeDateMustBeGreaterThanStartDate,
      );
    });

    it('owner deployed contract using specific deposit verifier', async function () {
      const users = await getUsers();
      const { user3Address } = users;

      await loadSQRPaymentGatewayFixture(this, {
        startDate: 0,
        depositVerifier: user3Address,
      });

      await this.owner2ERC20Token.transfer(this.user1Address, seedData.userInitBalance);
      await this.user1ERC20Token.approve(this.sqrPaymentGatewayAddress, seedData.deposit1);

      const signature = await signMessageForDeposit(
        this.user3,
        seedData.userId1,
        seedData.depositTransactionId1,
        this.user1Address,
        seedData.deposit1,
        seedData.depositNonce1_0,
        seedData.startDatePlus1m,
      );

      await this.user1SQRPaymentGateway.depositSig(
        seedData.userId1,
        seedData.depositTransactionId1,
        this.user1Address,
        seedData.deposit1,
        seedData.startDatePlus1m,
        signature,
      );
    });

    it('owner deployed contract using specific withdraw verifier', async function () {
      const users = await getUsers();
      const { user3Address } = users;

      await loadSQRPaymentGatewayFixture(this, {
        startDate: 0,
        withdrawVerifier: user3Address,
      });

      await this.owner2ERC20Token.transfer(this.sqrPaymentGatewayAddress, seedData.deposit1);

      const signature = await signMessageForWithdraw(
        this.user3,
        seedData.userId1,
        seedData.withdrawTransactionId1_0,
        this.user1Address,
        seedData.withdraw1,
        seedData.withdrawNonce1_0,
        seedData.startDatePlus1m,
      );

      await this.user1SQRPaymentGateway.withdrawSig(
        seedData.userId1,
        seedData.withdrawTransactionId1_0,
        this.user1Address,
        seedData.withdraw1,
        seedData.startDatePlus1m,
        signature,
      );
    });

    it('owner tries to deploy with invalid start date', async function () {
      const users = await getUsers();
      await expect(
        getSQRPaymentGatewayContext(users, {
          ...contractConfig,
          startDate: 1,
        }),
      ).revertedWithCustomError(
        this.owner2SQRPaymentGateway,
        customError.startDateMustBeGreaterThanCurrentTime,
      );
    });

    it('owner tries to deploy with invalid close date', async function () {
      const users = await getUsers();
      await expect(
        getSQRPaymentGatewayContext(users, {
          ...contractConfig,
          closeDate: 1,
        }),
      ).revertedWithCustomError(
        this.owner2SQRPaymentGateway,
        customError.closeDateMustBeGreaterThanCurrentTime,
      );
    });

    it('owner tries to deploy with zero cold wallet address', async function () {
      const users = await getUsers();
      await expect(
        getSQRPaymentGatewayContext(users, {
          ...contractConfig,
          coldWallet: ZeroAddress,
        }),
      ).revertedWithCustomError(this.owner2SQRPaymentGateway, customError.coldWalletNotZeroAddress);
    });

    it('owner deployed with zero deposit goal', async function () {
      const users = await getUsers();
      const { ownerSQRPaymentGateway } = await getSQRPaymentGatewayContext(users, {
        ...contractConfig,
        depositGoal: ZERO,
      });
      expect(await ownerSQRPaymentGateway.calculateRemainDeposit()).eq(MAX_INT);
    });

    it('owner deployed with zero withdraw goal', async function () {
      const users = await getUsers();
      const { ownerSQRPaymentGateway } = await getSQRPaymentGatewayContext(users, {
        ...contractConfig,
        withdrawGoal: ZERO,
      });
      expect(await ownerSQRPaymentGateway.calculateRemainWithdraw()).eq(MAX_INT);
    });
  });
}
