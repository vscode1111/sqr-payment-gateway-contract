import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { INITIAL_POSITIVE_CHECK_TEST_TITLE, waitTx } from '~common';
import { seedData } from '~seeds';
import { signMessageForDeposit } from '~utils';
import { errorMessage } from './testData';
import { DepositEventArgs, EmergencyWithdrawEventArgs } from './types';
import { checkTotalSQRBalance, findEvent, getSQRTokenBalance } from './utils';

export function shouldBehaveCorrectFunding(): void {
  describe('funding', () => {
    beforeEach(async function () {
      await checkTotalSQRBalance(this);
    });

    afterEach(async function () {
      await checkTotalSQRBalance(this);
    });

    it('user1 tries to deposit zero amount', async function () {
      const signature = await signMessageForDeposit(
        this.owner2,
        seedData.userId1,
        seedData.depositTransationId1,
        seedData.zero,
        seedData.nowPlus1m,
      );

      await expect(
        this.user1SQRPaymentGateway.depositSig(
          seedData.userId1,
          seedData.depositTransationId1,
          seedData.zero,
          seedData.nowPlus1m,
          signature,
        ),
      ).revertedWith(errorMessage.amountMustBeGreaterThanZero);
    });

    it('user1 tries to deposit without allowance', async function () {
      const signature = await signMessageForDeposit(
        this.owner2,
        seedData.userId1,
        seedData.depositTransationId1,
        seedData.deposit1,
        seedData.nowPlus1m,
      );

      await expect(
        this.user1SQRPaymentGateway.depositSig(
          seedData.userId1,
          seedData.depositTransationId1,
          seedData.deposit1,
          seedData.nowPlus1m,
          signature,
        ),
      ).revertedWith(errorMessage.userMustAllowToUseOfFund);
    });

    it('user1 tries to deposit in timeout case 1m', async function () {
      await time.increaseTo(seedData.nowPlus1m);

      const signature = await signMessageForDeposit(
        this.owner2,
        seedData.userId1,
        seedData.depositTransationId1,
        seedData.deposit1,
        seedData.nowPlus1m,
      );

      await expect(
        this.user1SQRPaymentGateway.depositSig(
          seedData.userId1,
          seedData.depositTransationId1,
          seedData.deposit1,
          seedData.nowPlus1m,
          signature,
        ),
      ).revertedWith(errorMessage.timeoutBlocker);
    });

    it('user1 tries to deposit with wrong signature', async function () {
      const wrongSignature = await signMessageForDeposit(
        this.owner2,
        seedData.userId2,
        seedData.depositTransationId1,
        seedData.deposit1,
        seedData.nowPlus1m,
      );

      await expect(
        this.user1SQRPaymentGateway.depositSig(
          seedData.userId1,
          seedData.depositTransationId1,
          seedData.deposit1,
          seedData.nowPlus1m,
          wrongSignature,
        ),
      ).revertedWith(errorMessage.invalidSignature);
    });

    it('user1 tries to deposit with allowance but no funds', async function () {
      await this.user1SQRToken.approve(this.sqrPaymentGatewayAddress, seedData.extraDeposit1);

      const signature = await signMessageForDeposit(
        this.owner2,
        seedData.userId1,
        seedData.depositTransationId1,
        seedData.deposit1,
        seedData.nowPlus1m,
      );

      await expect(
        this.user1SQRPaymentGateway.depositSig(
          seedData.userId1,
          seedData.depositTransationId1,
          seedData.deposit1,
          seedData.nowPlus1m,
          signature,
        ),
      ).revertedWith(errorMessage.userMustHaveFunds);
    });

    it('user2 tries to deposit without allowance', async function () {
      const signature = await signMessageForDeposit(
        this.owner2,
        seedData.userId2,
        seedData.depositTransationId2,
        seedData.deposit2,
        seedData.nowPlus1m,
      );

      await expect(
        this.user2SQRPaymentGateway.depositSig(
          seedData.userId2,
          seedData.depositTransationId2,
          seedData.deposit2,
          seedData.nowPlus1m,
          signature,
        ),
      ).revertedWith(errorMessage.userMustAllowToUseOfFund);
    });

    describe('user1 and user2 have tokens and approved contract to use these', () => {
      beforeEach(async function () {
        await this.owner2SQRToken.transfer(this.user1Address, seedData.userInitBalance);
        await this.user1SQRToken.approve(this.sqrPaymentGatewayAddress, seedData.deposit1);

        await this.owner2SQRToken.transfer(this.user2Address, seedData.userInitBalance);
        await this.user2SQRToken.approve(this.sqrPaymentGatewayAddress, seedData.deposit2);
      });

      it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
        expect(await getSQRTokenBalance(this, this.user1Address)).eq(seedData.userInitBalance);
        expect(await getSQRTokenBalance(this, this.user2Address)).eq(seedData.userInitBalance);
      });

      it('check hash collision for signMessageForDeposit', async function () {
        const wrongSignature = await signMessageForDeposit(
          this.owner2,
          '123',
          '123',
          seedData.deposit1,
          seedData.nowPlus1m,
        );

        await expect(
          this.user1SQRPaymentGateway.depositSig(
            '12',
            '3123',
            seedData.deposit1,
            seedData.nowPlus1m,
            wrongSignature,
          ),
        ).revertedWith(errorMessage.invalidSignature);
      });

      it('user1 is allowed to deposit (check event)', async function () {
        const signature = await signMessageForDeposit(
          this.owner2,
          seedData.userId1,
          seedData.depositTransationId1,
          seedData.deposit1,
          seedData.nowPlus1m,
        );

        const receipt = await waitTx(
          this.user1SQRPaymentGateway.depositSig(
            seedData.userId1,
            seedData.depositTransationId1,
            seedData.deposit1,
            seedData.nowPlus1m,
            signature,
          ),
        );
        const eventLog = findEvent<DepositEventArgs>(receipt);

        expect(eventLog).not.undefined;
        const [account, amount] = eventLog?.args;
        expect(account).eq(this.user1Address);
        expect(amount).eq(seedData.deposit1);
      });

      it('user1 deposited extrafunds', async function () {
        expect(await getSQRTokenBalance(this, this.coldWalletAddress)).eq(seedData.zero);

        await this.user1SQRToken.approve(this.sqrPaymentGatewayAddress, seedData.extraDeposit1);

        const signature = await signMessageForDeposit(
          this.owner2,
          seedData.userId1,
          seedData.depositTransationId1,
          seedData.extraDeposit1,
          seedData.nowPlus1m,
        );

        await this.user1SQRPaymentGateway.depositSig(
          seedData.userId1,
          seedData.depositTransationId1,
          seedData.extraDeposit1,
          seedData.nowPlus1m,
          signature,
        );

        const balanceLimit = await this.owner2SQRPaymentGateway.balanceLimit();

        expect(await getSQRTokenBalance(this, this.coldWalletAddress)).eq(
          seedData.extraDeposit1 - balanceLimit,
        );

        expect(await this.owner2SQRPaymentGateway.getBalance()).eq(balanceLimit);

        expect(await getSQRTokenBalance(this, this.user1Address)).eq(
          seedData.userInitBalance - seedData.extraDeposit1,
        );
        expect(await getSQRTokenBalance(this, this.sqrPaymentGatewayAddress)).eq(balanceLimit);

        expect(await this.owner2SQRPaymentGateway.balanceOf(seedData.userId1)).eq(seedData.extraDeposit1);

        const fundItem = await this.user1SQRPaymentGateway.fetchFundItem(seedData.userId1);
        expect(fundItem.balance).eq(seedData.extraDeposit1);

        expect(await this.owner2SQRPaymentGateway.totalBalance()).eq(seedData.extraDeposit1);
      });

      it('user1 deposits when user2 tranfered tokens to contract directly', async function () {
        await this.user2SQRToken.transfer(this.sqrPaymentGatewayAddress, seedData.extraDeposit2);

        await this.user1SQRToken.approve(this.sqrPaymentGatewayAddress, seedData.extraDeposit1);

        const signature = await signMessageForDeposit(
          this.owner2,
          seedData.userId1,
          seedData.depositTransationId1,
          seedData.deposit1,
          seedData.nowPlus1m,
        );

        await this.user1SQRPaymentGateway.depositSig(
          seedData.userId1,
          seedData.depositTransationId1,
          seedData.deposit1,
          seedData.nowPlus1m,
          signature,
        );

        expect(await this.owner2SQRPaymentGateway.getBalance()).eq(
          await this.owner2SQRPaymentGateway.balanceLimit(),
        );

        expect(await getSQRTokenBalance(this, this.user1Address)).eq(
          seedData.userInitBalance - seedData.deposit1,
        );

        expect(await this.owner2SQRPaymentGateway.balanceOf(seedData.userId1)).eq(seedData.deposit1);

        const fundItem = await this.user1SQRPaymentGateway.fetchFundItem(seedData.userId1);
        expect(fundItem.balance).eq(seedData.deposit1);

        expect(await this.owner2SQRPaymentGateway.totalBalance()).eq(seedData.deposit1);

        const transactionItem = await this.user1SQRPaymentGateway.fetchTransactionItem(
          seedData.depositTransationId1,
        );
        expect(transactionItem.amount).eq(seedData.deposit1);
      });

      describe('user1 deposited funds', () => {
        beforeEach(async function () {
          const signature = await signMessageForDeposit(
            this.owner2,
            seedData.userId1,
            seedData.depositTransationId1,
            seedData.deposit1,
            seedData.nowPlus1m,
          );

          await this.user1SQRPaymentGateway.depositSig(
            seedData.userId1,
            seedData.depositTransationId1,
            seedData.deposit1,
            seedData.nowPlus1m,
            signature,
          );
        });

        it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
          expect(await getSQRTokenBalance(this, this.user1Address)).eq(
            seedData.userInitBalance - seedData.deposit1,
          );

          expect(await this.owner2SQRPaymentGateway.balanceOf(seedData.userId1)).eq(seedData.deposit1);

          const fundItem = await this.user1SQRPaymentGateway.fetchFundItem(seedData.userId1);
          expect(fundItem.balance).eq(seedData.deposit1);

          expect(await this.owner2SQRPaymentGateway.totalBalance()).eq(seedData.deposit1);

          const transactionItem = await this.user1SQRPaymentGateway.fetchTransactionItem(
            seedData.depositTransationId1,
          );
          expect(transactionItem.amount).eq(seedData.deposit1);
        });

        it('user1 tries to call deposit with the same transationId', async function () {
          await this.user1SQRToken.approve(this.sqrPaymentGatewayAddress, seedData.extraDeposit1);

          const signature = await signMessageForDeposit(
            this.owner2,
            seedData.userId1,
            seedData.depositTransationId1,
            seedData.deposit1,
            seedData.nowPlus1m,
          );

          await expect(
            this.user1SQRPaymentGateway.depositSig(
              seedData.userId1,
              seedData.depositTransationId1,
              seedData.deposit1,
              seedData.nowPlus1m,
              signature,
            ),
          ).revertedWith(errorMessage.transactionIdWasUsedBefore);
        });

        it('owner2 call emergencyWithdraw (check event)', async function () {
          expect(await getSQRTokenBalance(this, this.user3Address)).eq(seedData.zero);

          const contractAmount = await this.owner2SQRPaymentGateway.getBalance();

          const receipt = await waitTx(
            this.owner2SQRPaymentGateway.emergencyWithdraw(
              this.sqrTokenAddress,
              this.user3Address,
              contractAmount,
            ),
          );
          const eventLog = findEvent<EmergencyWithdrawEventArgs>(receipt);

          expect(eventLog).not.undefined;
          const [token, to, amount] = eventLog?.args;
          expect(token).eq(this.sqrTokenAddress);
          expect(to).eq(this.user3Address);
          expect(amount).closeTo(contractAmount, seedData.balanceDelta);

          expect(await getSQRTokenBalance(this, this.user1Address)).eq(
            seedData.userInitBalance - seedData.deposit1,
          );
          expect(await getSQRTokenBalance(this, this.user2Address)).eq(seedData.userInitBalance);
          expect(await getSQRTokenBalance(this, this.user3Address)).eq(contractAmount);

          expect(await this.owner2SQRPaymentGateway.balanceOf(seedData.userId1)).eq(seedData.deposit1);
          expect(await this.owner2SQRPaymentGateway.balanceOf(seedData.userId2)).eq(seedData.zero);

          const fundItem = await this.user1SQRPaymentGateway.fetchFundItem(seedData.userId1);
          expect(fundItem.balance).eq(seedData.deposit1);

          expect(await this.owner2SQRPaymentGateway.totalBalance()).eq(seedData.deposit1);
        });

        it('owner2 tries to call emergencyWithdraw (check event)', async function () {
          const contractAmount = await this.owner2SQRPaymentGateway.getBalance();

          await expect(
            this.user1SQRPaymentGateway.emergencyWithdraw(
              this.sqrTokenAddress,
              this.user3Address,
              contractAmount,
            ),
          ).revertedWith(errorMessage.onlyOwner);
        });
      });
    });
  });
}
