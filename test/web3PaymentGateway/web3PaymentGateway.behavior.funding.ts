import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { INITIAL_POSITIVE_CHECK_TEST_TITLE } from '~common';
import { waitTx } from '~common-contract';
import { contractConfig, seedData } from '~seeds';
import {
  addSecondsToUnixTime,
  signMessageForWEB3PaymentGatewayDeposit,
  signMessageForWEB3PaymentGatewayWithdraw,
} from '~utils';
import { customError } from './testData';
import { DepositEventArgs, ForceWithdrawEventArgs, WithdrawEventArgs } from './types';
import {
  checkTotalWEB3Balance,
  findEvent,
  getERC20TokenBalance,
  loadWEB3PaymentGatewayFixture,
} from './utils';

export function shouldBehaveCorrectFunding(): void {
  describe('funding', () => {
    beforeEach(async function () {
      await loadWEB3PaymentGatewayFixture(this);
      await checkTotalWEB3Balance(this);
    });

    afterEach(async function () {
      await checkTotalWEB3Balance(this);
    });

    it('user1 tries to call depositSig too early', async function () {
      expect(await this.owner2WEB3PaymentGateway.calculateRemainDeposit()).eq(seedData.zero);
      expect(await this.owner2WEB3PaymentGateway.calculateRemainWithdraw()).eq(seedData.zero);

      const signature = await signMessageForWEB3PaymentGatewayDeposit(
        this.owner2,
        seedData.userId1,
        seedData.depositTransactionId1,
        this.user1Address,
        seedData.deposit1,
        seedData.depositNonce1_0,
        seedData.startDatePlus1m,
      );

      await expect(
        this.user1WEB3PaymentGateway.depositSig(
          seedData.userId1,
          seedData.depositTransactionId1,
          this.user1Address,
          seedData.deposit1,
          seedData.startDatePlus1m,
          signature,
        ),
      ).revertedWithCustomError(this.owner2WEB3PaymentGateway, customError.tooEarly);
    });

    it('user1 tries to call depositSig too late', async function () {
      await time.increaseTo(addSecondsToUnixTime(contractConfig.closeDate, seedData.timeShift));

      expect(await this.owner2WEB3PaymentGateway.calculateRemainDeposit()).eq(seedData.zero);
      expect(await this.owner2WEB3PaymentGateway.calculateRemainWithdraw()).eq(seedData.zero);

      const signature = await signMessageForWEB3PaymentGatewayDeposit(
        this.owner2,
        seedData.userId1,
        seedData.depositTransactionId1,
        this.user1Address,
        seedData.deposit1,
        seedData.depositNonce1_0,
        seedData.closeDatePlus1m,
      );

      await expect(
        this.user1WEB3PaymentGateway.depositSig(
          seedData.userId1,
          seedData.depositTransactionId1,
          this.user1Address,
          seedData.deposit1,
          seedData.closeDatePlus1m,
          signature,
        ),
      ).revertedWithCustomError(this.owner2WEB3PaymentGateway, customError.tooLate);
    });

    describe('set time after start date', () => {
      beforeEach(async function () {
        await time.increaseTo(addSecondsToUnixTime(contractConfig.startDate, seedData.timeShift));
      });

      it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
        expect(await this.user1WEB3PaymentGateway.getDepositNonce(seedData.userId1)).eq(0);
        expect(await this.user2WEB3PaymentGateway.getDepositNonce(seedData.userId2)).eq(0);
        expect(await this.user1WEB3PaymentGateway.getWithdrawNonce(seedData.userId1)).eq(0);
        expect(await this.user2WEB3PaymentGateway.getWithdrawNonce(seedData.userId2)).eq(0);
        expect(await this.owner2WEB3PaymentGateway.calculateRemainDeposit()).eq(
          contractConfig.depositGoal,
        );
        expect(await this.owner2WEB3PaymentGateway.getDepositRefundFetchReady()).eq(false);
      });

      it('user1 tries to call depositSig with zero amount', async function () {
        const signature = await signMessageForWEB3PaymentGatewayDeposit(
          this.owner2,
          seedData.userId1,
          seedData.depositTransactionId1,
          this.user1Address,
          seedData.zero,
          seedData.depositNonce1_0,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1WEB3PaymentGateway.depositSig(
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            seedData.zero,
            seedData.startDatePlus1m,
            signature,
          ),
        ).revertedWithCustomError(this.owner2WEB3PaymentGateway, customError.amountNotZero);
      });

      it('user1 tries to call depositSig without allowance', async function () {
        const signature = await signMessageForWEB3PaymentGatewayDeposit(
          this.owner2,
          seedData.userId1,
          seedData.depositTransactionId1,
          this.user1Address,
          seedData.deposit1,
          seedData.depositNonce1_0,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1WEB3PaymentGateway.depositSig(
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            seedData.deposit1,
            seedData.startDatePlus1m,
            signature,
          ),
        ).revertedWithCustomError(
          this.owner2WEB3PaymentGateway,
          customError.userMustAllowToUseFunds,
        );
      });

      it('user1 tries to call depositSig in timeout case 1m', async function () {
        await time.increaseTo(seedData.startDatePlus1m);

        const signature = await signMessageForWEB3PaymentGatewayDeposit(
          this.owner2,
          seedData.userId1,
          seedData.depositTransactionId1,
          this.user1Address,
          seedData.deposit1,
          seedData.depositNonce1_0,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1WEB3PaymentGateway.depositSig(
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            seedData.deposit1,
            seedData.startDatePlus1m,
            signature,
          ),
        ).revertedWithCustomError(this.owner2WEB3PaymentGateway, customError.timeoutBlocker);
      });

      it('user1 tries to call depositSig with wrong signature', async function () {
        const wrongSignature = await signMessageForWEB3PaymentGatewayDeposit(
          this.owner2,
          seedData.userId2,
          seedData.depositTransactionId1,
          this.user1Address,
          seedData.deposit1,
          seedData.depositNonce1_0,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1WEB3PaymentGateway.depositSig(
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            seedData.deposit1,
            seedData.startDatePlus1m,
            wrongSignature,
          ),
        ).revertedWithCustomError(this.owner2WEB3PaymentGateway, customError.invalidSignature);
      });

      it('user1 tries to call depositSig with allowance but no funds', async function () {
        await this.user1ERC20Token.approve(this.web3PaymentGatewayAddress, seedData.extraDeposit1);

        const signature = await signMessageForWEB3PaymentGatewayDeposit(
          this.owner2,
          seedData.userId1,
          seedData.depositTransactionId1,
          this.user1Address,
          seedData.deposit1,
          seedData.depositNonce1_0,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1WEB3PaymentGateway.depositSig(
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            seedData.deposit1,
            seedData.startDatePlus1m,
            signature,
          ),
        ).revertedWithCustomError(this.owner2WEB3PaymentGateway, customError.userMustHaveFunds);
      });

      it('user2 tries to call depositSig without allowance', async function () {
        const signature = await signMessageForWEB3PaymentGatewayDeposit(
          this.owner2,
          seedData.userId2,
          seedData.depositTransactionId2_0,
          this.user2Address,
          seedData.deposit2_0,
          seedData.depositNonce2_0,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user2WEB3PaymentGateway.depositSig(
            seedData.userId2,
            seedData.depositTransactionId2_0,
            this.user2Address,
            seedData.deposit2_0,
            seedData.startDatePlus1m,
            signature,
          ),
        ).revertedWithCustomError(
          this.owner2WEB3PaymentGateway,
          customError.userMustAllowToUseFunds,
        );
      });

      describe('user1 and user2 have tokens and approved contract to use these', () => {
        beforeEach(async function () {
          await this.owner2ERC20Token.transfer(this.user1Address, seedData.userInitBalance);
          await this.user1ERC20Token.approve(this.web3PaymentGatewayAddress, seedData.deposit1);

          await this.owner2ERC20Token.transfer(this.user2Address, seedData.userInitBalance);
          await this.user2ERC20Token.approve(this.web3PaymentGatewayAddress, seedData.deposit2_0);
        });

        it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
          expect(await getERC20TokenBalance(this, this.user1Address)).eq(seedData.userInitBalance);
          expect(await getERC20TokenBalance(this, this.user2Address)).eq(seedData.userInitBalance);
        });

        it('check hash collision for signMessageForDeposit', async function () {
          const wrongSignature = await signMessageForWEB3PaymentGatewayDeposit(
            this.owner2,
            '123',
            '123',
            this.user1Address,
            seedData.deposit1,
            seedData.depositNonce1_0,
            seedData.startDatePlus1m,
          );

          await expect(
            this.user1WEB3PaymentGateway.depositSig(
              '12',
              '3123',
              this.user1Address,
              seedData.deposit1,
              seedData.startDatePlus1m,
              wrongSignature,
            ),
          ).revertedWithCustomError(this.owner2WEB3PaymentGateway, customError.invalidSignature);
        });

        it('user1 is allowed to deposit (check event)', async function () {
          const signature = await signMessageForWEB3PaymentGatewayDeposit(
            this.owner2,
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            seedData.deposit1,
            seedData.depositNonce1_0,
            seedData.startDatePlus1m,
          );

          const receipt = await waitTx(
            this.user1WEB3PaymentGateway.depositSig(
              seedData.userId1,
              seedData.depositTransactionId1,
              this.user1Address,
              seedData.deposit1,
              seedData.startDatePlus1m,
              signature,
            ),
          );
          const eventLog = findEvent<DepositEventArgs>(receipt);

          expect(eventLog).not.undefined;
          const [account, amount] = eventLog?.args;
          expect(account).eq(this.user1Address);
          expect(amount).eq(seedData.deposit1);
        });

        it('user1 tries to call deposit without permission', async function () {
          await expect(
            this.user1WEB3PaymentGateway.deposit(
              seedData.userId1,
              seedData.depositTransactionId1,
              this.user1Address,
              seedData.extraDeposit1,
              seedData.depositNonce1_0,
              seedData.startDatePlus1m,
            ),
          )
            .revertedWithCustomError(
              this.owner2WEB3PaymentGateway,
              customError.ownableUnauthorizedAccount,
            )
            .withArgs(this.user1Address);
        });

        it('owner2 tries to call deposit with invalid nonce', async function () {
          await expect(
            this.owner2WEB3PaymentGateway.deposit(
              seedData.userId1,
              seedData.depositTransactionId1,
              this.user1Address,
              seedData.deposit1,
              seedData.invalidNonce,
              seedData.startDatePlus1m,
            ),
          ).revertedWithCustomError(this.owner2WEB3PaymentGateway, customError.invalidNonce);
        });

        it('owner2 deposit funds', async function () {
          expect(await getERC20TokenBalance(this, this.coldWalletAddress)).eq(seedData.zero);

          await this.user1ERC20Token.approve(this.web3PaymentGatewayAddress, seedData.extraDeposit1);

          const nonce = await this.user2WEB3PaymentGateway.getDepositNonce(seedData.userId1);

          await this.owner2WEB3PaymentGateway.deposit(
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            seedData.extraDeposit1,
            nonce,
            seedData.startDatePlus1m,
          );

          const balanceLimit = await this.owner2WEB3PaymentGateway.balanceLimit();

          expect(await getERC20TokenBalance(this, this.coldWalletAddress)).eq(
            seedData.extraDeposit1 - balanceLimit,
          );

          expect(await this.owner2WEB3PaymentGateway.getBalance()).eq(balanceLimit);

          expect(await getERC20TokenBalance(this, this.user1Address)).eq(
            seedData.userInitBalance - seedData.extraDeposit1,
          );
          expect(await getERC20TokenBalance(this, this.web3PaymentGatewayAddress)).eq(balanceLimit);

          expect(await this.owner2WEB3PaymentGateway.balanceOf(seedData.userId1)).eq(
            seedData.extraDeposit1,
          );

          const { depositedAmount: userDepositedAmount } =
            await this.user1WEB3PaymentGateway.fetchUserFundItem(seedData.userId1);
          expect(userDepositedAmount).eq(seedData.extraDeposit1);

          const { depositedAmount: accountDepositedAmount } =
            await this.user1WEB3PaymentGateway.fetchAccountFundItem(this.user1Address);
          expect(accountDepositedAmount).eq(seedData.extraDeposit1);

          expect(await this.owner2WEB3PaymentGateway.totalDeposited()).eq(seedData.extraDeposit1);
          expect(await this.owner2WEB3PaymentGateway.calculateRemainDeposit()).eq(
            contractConfig.depositGoal - seedData.extraDeposit1,
          );
        });

        it('user1 deposited extrafunds', async function () {
          expect(await getERC20TokenBalance(this, this.coldWalletAddress)).eq(seedData.zero);

          await this.user1ERC20Token.approve(this.web3PaymentGatewayAddress, seedData.extraDeposit1);

          const signature = await signMessageForWEB3PaymentGatewayDeposit(
            this.owner2,
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            seedData.extraDeposit1,
            seedData.depositNonce1_0,
            seedData.startDatePlus1m,
          );

          await this.user1WEB3PaymentGateway.depositSig(
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            seedData.extraDeposit1,
            seedData.startDatePlus1m,
            signature,
          );

          const balanceLimit = await this.owner2WEB3PaymentGateway.balanceLimit();

          expect(await getERC20TokenBalance(this, this.coldWalletAddress)).eq(
            seedData.extraDeposit1 - balanceLimit,
          );

          expect(await this.owner2WEB3PaymentGateway.getBalance()).eq(balanceLimit);

          expect(await getERC20TokenBalance(this, this.user1Address)).eq(
            seedData.userInitBalance - seedData.extraDeposit1,
          );
          expect(await getERC20TokenBalance(this, this.web3PaymentGatewayAddress)).eq(balanceLimit);

          expect(await this.owner2WEB3PaymentGateway.balanceOf(seedData.userId1)).eq(
            seedData.extraDeposit1,
          );

          const { depositedAmount: userDepositedAmount } =
            await this.user1WEB3PaymentGateway.fetchUserFundItem(seedData.userId1);
          expect(userDepositedAmount).eq(seedData.extraDeposit1);

          const { depositedAmount: accountDepositedAmount } =
            await this.user1WEB3PaymentGateway.fetchAccountFundItem(this.user1Address);
          expect(accountDepositedAmount).eq(seedData.extraDeposit1);

          expect(await this.owner2WEB3PaymentGateway.totalDeposited()).eq(seedData.extraDeposit1);

          expect(await this.owner2WEB3PaymentGateway.calculateRemainDeposit()).eq(
            contractConfig.depositGoal - seedData.extraDeposit1,
          );

          expect(await this.ownerWEB3PaymentGateway.getAccountCount()).eq(1);
          expect(await this.ownerWEB3PaymentGateway.getAccountByIndex(0)).eq(this.user1Address);

          expect(
            await this.ownerWEB3PaymentGateway.getDepositRefundAllocation(this.user1Address),
          ).eq(seedData.zero);
          const {
            baseDeposited: baseDeposited1,
            boosted: boosted1,
            baseAllocation: baseAllocation1,
            baseRefund: baseRefund1,
            boostRefund: boostRefund1,
            nonce: nonce1,
          } = await this.ownerWEB3PaymentGateway.getDepositRefundAccountInfo(this.user1Address);
          expect(baseDeposited1).eq(seedData.extraDeposit1);
          expect(boosted1).eq(false);
          expect(baseAllocation1).eq(seedData.zero);
          expect(baseRefund1).eq(seedData.extraDeposit1);
          expect(boostRefund1).eq(seedData.zero);
          expect(nonce1).eq(1);

          const { totalBaseDeposited } =
            await this.ownerWEB3PaymentGateway.getDepositRefundContractInfo();
          expect(totalBaseDeposited).eq(await this.ownerWEB3PaymentGateway.totalDeposited());
          expect(await this.ownerWEB3PaymentGateway.isReachedDepositGoal()).eq(false);

          expect(await this.ownerWEB3PaymentGateway.fetchUserAccounts(seedData.userId1)).eql([
            this.user1Address,
          ]);
          expect(await this.ownerWEB3PaymentGateway.fetchUserAccounts(seedData.userId2)).eql([]);
        });

        it('user1 tries to deposit extra funds', async function () {
          const extraDeposit = seedData.extraDeposit1 * BigInt(2);

          await this.user1ERC20Token.approve(this.web3PaymentGatewayAddress, extraDeposit);

          const signature = await signMessageForWEB3PaymentGatewayDeposit(
            this.owner2,
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            extraDeposit,
            seedData.depositNonce1_0,
            seedData.startDatePlus1m,
          );

          await expect(
            this.user1WEB3PaymentGateway.depositSig(
              seedData.userId1,
              seedData.depositTransactionId1,
              this.user1Address,
              extraDeposit,
              seedData.startDatePlus1m,
              signature,
            ),
          ).revertedWithCustomError(this.owner2WEB3PaymentGateway, customError.achievedDepositGoal);

          expect(await this.ownerWEB3PaymentGateway.getAccountCount()).eq(0);
        });

        it('user1 deposited after user2 transferred tokens to contract directly', async function () {
          await this.user2ERC20Token.transfer(
            this.web3PaymentGatewayAddress,
            seedData.extraDeposit2,
          );

          await this.user1ERC20Token.approve(this.web3PaymentGatewayAddress, seedData.extraDeposit1);

          const signature = await signMessageForWEB3PaymentGatewayDeposit(
            this.owner2,
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            seedData.deposit1,
            seedData.depositNonce1_0,
            seedData.startDatePlus1m,
          );

          await this.user1WEB3PaymentGateway.depositSig(
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            seedData.deposit1,
            seedData.startDatePlus1m,
            signature,
          );

          expect(await this.owner2WEB3PaymentGateway.getBalance()).eq(
            await this.owner2WEB3PaymentGateway.balanceLimit(),
          );

          expect(await getERC20TokenBalance(this, this.user1Address)).eq(
            seedData.userInitBalance - seedData.deposit1,
          );

          expect(await this.owner2WEB3PaymentGateway.balanceOf(seedData.userId1)).eq(
            seedData.deposit1,
          );

          const { depositedAmount: userDepositedAmount } =
            await this.user1WEB3PaymentGateway.fetchUserFundItem(seedData.userId1);
          expect(userDepositedAmount).eq(seedData.deposit1);

          const { depositedAmount: accountDepositedAmount } =
            await this.user1WEB3PaymentGateway.fetchAccountFundItem(this.user1Address);
          expect(accountDepositedAmount).eq(seedData.deposit1);

          expect(await this.owner2WEB3PaymentGateway.totalDeposited()).eq(seedData.deposit1);

          const transactionItem = await this.user1WEB3PaymentGateway.fetchTransactionItem(
            seedData.depositTransactionId1,
          );
          expect(transactionItem.amount).eq(seedData.deposit1);
        });

        describe('user1 deposited funds', () => {
          beforeEach(async function () {
            const nonce = await this.user1WEB3PaymentGateway.getDepositNonce(seedData.userId1);

            const signature = await signMessageForWEB3PaymentGatewayDeposit(
              this.owner2,
              seedData.userId1,
              seedData.depositTransactionId1,
              this.user1Address,
              seedData.deposit1,
              Number(nonce),
              seedData.startDatePlus1m,
            );

            await this.user1WEB3PaymentGateway.depositSig(
              seedData.userId1,
              seedData.depositTransactionId1,
              this.user1Address,
              seedData.deposit1,
              seedData.startDatePlus1m,
              signature,
            );
          });

          it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
            expect(await getERC20TokenBalance(this, this.user1Address)).eq(
              seedData.userInitBalance - seedData.deposit1,
            );

            expect(await this.owner2WEB3PaymentGateway.balanceOf(seedData.userId1)).eq(
              seedData.deposit1,
            );

            const { depositedAmount: userDepositedAmount } =
              await this.user1WEB3PaymentGateway.fetchUserFundItem(seedData.userId1);
            expect(userDepositedAmount).eq(seedData.deposit1);

            const { depositedAmount: accountDepositedAmount } =
              await this.user1WEB3PaymentGateway.fetchAccountFundItem(this.user1Address);
            expect(accountDepositedAmount).eq(seedData.deposit1);

            expect(await this.owner2WEB3PaymentGateway.totalDeposited()).eq(seedData.deposit1);

            const transactionItem = await this.user1WEB3PaymentGateway.fetchTransactionItem(
              seedData.depositTransactionId1,
            );
            expect(transactionItem.amount).eq(seedData.deposit1);

            expect(await this.user1WEB3PaymentGateway.getDepositNonce(seedData.userId1)).eq(1);
            expect(await this.user2WEB3PaymentGateway.getDepositNonce(seedData.userId2)).eq(0);
            expect(await this.user1WEB3PaymentGateway.getWithdrawNonce(seedData.userId1)).eq(0);
            expect(await this.user2WEB3PaymentGateway.getWithdrawNonce(seedData.userId2)).eq(0);

            expect(await this.owner2WEB3PaymentGateway.calculateRemainWithdraw()).eq(
              contractConfig.withdrawGoal,
            );

            expect(await this.ownerWEB3PaymentGateway.getAccountCount()).eq(1);
            expect(await this.ownerWEB3PaymentGateway.getAccountByIndex(0)).eq(this.user1Address);

            expect(
              await this.ownerWEB3PaymentGateway.getDepositRefundAllocation(this.user1Address),
            ).eq(seedData.zero);
            const {
              baseDeposited: baseDeposited1,
              boosted: boosted1,
              baseAllocation: baseAllocation1,
              baseRefund: baseRefund1,
              boostRefund: boostRefund1,
              nonce: nonce1,
            } = await this.ownerWEB3PaymentGateway.getDepositRefundAccountInfo(this.user1Address);
            expect(baseDeposited1).eq(seedData.deposit1);
            expect(boosted1).eq(false);
            expect(baseAllocation1).eq(seedData.zero);
            expect(baseRefund1).eq(seedData.deposit1);
            expect(boostRefund1).eq(seedData.zero);
            expect(nonce1).eq(1);

            const { totalBaseDeposited } =
              await this.ownerWEB3PaymentGateway.getDepositRefundContractInfo();
            expect(totalBaseDeposited).eq(await this.ownerWEB3PaymentGateway.totalDeposited());
            expect(await this.ownerWEB3PaymentGateway.isReachedDepositGoal()).eq(false);

            expect(await this.ownerWEB3PaymentGateway.fetchUserAccounts(seedData.userId1)).eql([
              this.user1Address,
            ]);
            expect(await this.ownerWEB3PaymentGateway.fetchUserAccounts(seedData.userId2)).eql([]);
          });

          it('user1 tries to call depositSig with the same transactionId', async function () {
            await this.user1ERC20Token.approve(
              this.web3PaymentGatewayAddress,
              seedData.extraDeposit1,
            );

            const signature = await signMessageForWEB3PaymentGatewayDeposit(
              this.owner2,
              seedData.userId1,
              seedData.depositTransactionId1,
              this.user1Address,
              seedData.deposit1,
              seedData.depositNonce1_1,
              seedData.startDatePlus1m,
            );

            await expect(
              this.user1WEB3PaymentGateway.depositSig(
                seedData.userId1,
                seedData.depositTransactionId1,
                this.user1Address,
                seedData.deposit1,
                seedData.startDatePlus1m,
                signature,
              ),
            ).revertedWithCustomError(this.owner2WEB3PaymentGateway, customError.usedTransactionId);
          });

          it('owner2 call forceWithdraw (check event)', async function () {
            expect(await getERC20TokenBalance(this, this.user3Address)).eq(seedData.zero);

            const contractAmount = await this.owner2WEB3PaymentGateway.getBalance();

            const receipt = await waitTx(
              this.owner2WEB3PaymentGateway.forceWithdraw(
                this.erc20TokenAddress,
                this.user3Address,
                contractAmount,
              ),
            );
            const eventLog = findEvent<ForceWithdrawEventArgs>(receipt);

            expect(eventLog).not.undefined;
            const [token, to, amount] = eventLog?.args;
            expect(token).eq(this.erc20TokenAddress);
            expect(to).eq(this.user3Address);
            expect(amount).closeTo(contractAmount, seedData.balanceDelta);

            expect(await getERC20TokenBalance(this, this.user1Address)).eq(
              seedData.userInitBalance - seedData.deposit1,
            );
            expect(await getERC20TokenBalance(this, this.user2Address)).eq(
              seedData.userInitBalance,
            );
            expect(await getERC20TokenBalance(this, this.user3Address)).eq(contractAmount);

            expect(await this.owner2WEB3PaymentGateway.balanceOf(seedData.userId1)).eq(
              seedData.deposit1,
            );
            expect(await this.owner2WEB3PaymentGateway.balanceOf(seedData.userId2)).eq(
              seedData.zero,
            );

            const { depositedAmount: userDepositedAmount } =
              await this.user1WEB3PaymentGateway.fetchUserFundItem(seedData.userId1);
            expect(userDepositedAmount).eq(seedData.deposit1);

            const { depositedAmount: accountDepositedAmount } =
              await this.user1WEB3PaymentGateway.fetchAccountFundItem(this.user1Address);
            expect(accountDepositedAmount).eq(seedData.deposit1);

            expect(await this.owner2WEB3PaymentGateway.totalDeposited()).eq(seedData.deposit1);
          });

          it('user1 tries to call forceWithdraw without permission', async function () {
            const contractAmount = await this.owner2WEB3PaymentGateway.getBalance();

            await expect(
              this.user1WEB3PaymentGateway.forceWithdraw(
                this.erc20TokenAddress,
                this.user3Address,
                contractAmount,
              ),
            )
              .revertedWithCustomError(
                this.owner2WEB3PaymentGateway,
                customError.ownableUnauthorizedAccount,
              )
              .withArgs(this.user1Address);
          });

          it('user1 tries to call withdrawSig with wrong signature', async function () {
            const signature = await signMessageForWEB3PaymentGatewayWithdraw(
              this.owner2,
              seedData.userId2,
              seedData.withdrawTransactionId1_0,
              this.user1Address,
              seedData.extraWithdraw1,
              seedData.withdrawNonce1_0,
              seedData.startDatePlus1m,
            );

            await expect(
              this.user1WEB3PaymentGateway.withdrawSig(
                seedData.userId1,
                seedData.withdrawTransactionId1_0,
                this.user1Address,
                seedData.extraWithdraw1,
                seedData.startDatePlus1m,
                signature,
              ),
            ).revertedWithCustomError(this.owner2WEB3PaymentGateway, customError.invalidSignature);
          });

          it('user1 tries to call depositSig in timeout case 1m', async function () {
            await time.increaseTo(seedData.startDatePlus1m);

            const signature = await signMessageForWEB3PaymentGatewayWithdraw(
              this.owner2,
              seedData.userId1,
              seedData.withdrawTransactionId1_0,
              this.user1Address,
              seedData.extraWithdraw1,
              seedData.withdrawNonce1_0,
              seedData.startDatePlus1m,
            );

            await expect(
              this.user1WEB3PaymentGateway.withdrawSig(
                seedData.userId1,
                seedData.withdrawTransactionId1_0,
                this.user1Address,
                seedData.extraWithdraw1,
                seedData.startDatePlus1m,
                signature,
              ),
            ).revertedWithCustomError(this.owner2WEB3PaymentGateway, customError.timeoutBlocker);
          });

          it('user1 tries to call withdrawSig with zero amount', async function () {
            const signature = await signMessageForWEB3PaymentGatewayWithdraw(
              this.owner2,
              seedData.userId2,
              seedData.withdrawTransactionId1_0,
              this.user1Address,
              seedData.zero,
              seedData.withdrawNonce1_0,
              seedData.startDatePlus1m,
            );

            await expect(
              this.user1WEB3PaymentGateway.withdrawSig(
                seedData.userId2,
                seedData.withdrawTransactionId1_0,
                this.user1Address,
                seedData.zero,
                seedData.startDatePlus1m,
                signature,
              ),
            ).revertedWithCustomError(this.owner2WEB3PaymentGateway, customError.amountNotZero);
          });

          it('user1 tries to call withdrawSig from contract without required funds', async function () {
            const signature = await signMessageForWEB3PaymentGatewayWithdraw(
              this.owner2,
              seedData.userId1,
              seedData.withdrawTransactionId1_0,
              this.user1Address,
              seedData.extraWithdraw1,
              seedData.withdrawNonce1_0,
              seedData.startDatePlus1m,
            );

            await expect(
              this.user1WEB3PaymentGateway.withdrawSig(
                seedData.userId1,
                seedData.withdrawTransactionId1_0,
                this.user1Address,
                seedData.extraWithdraw1,
                seedData.startDatePlus1m,
                signature,
              ),
            ).revertedWithCustomError(
              this.owner2WEB3PaymentGateway,
              customError.contractMustHaveSufficientFunds,
            );
          });

          it('user1 tries to call withdraw without permission', async function () {
            await expect(
              this.user1WEB3PaymentGateway.withdraw(
                seedData.userId1,
                seedData.withdrawTransactionId1_0,
                this.user1Address,
                seedData.extraWithdraw1,
                seedData.withdrawNonce1_0,
                seedData.startDatePlus1m,
              ),
            )
              .revertedWithCustomError(
                this.owner2WEB3PaymentGateway,
                customError.ownableUnauthorizedAccount,
              )
              .withArgs(this.user1Address);
          });

          it('owner2 tries to call withdraw with invalid nonce', async function () {
            await expect(
              this.owner2WEB3PaymentGateway.withdraw(
                seedData.userId1,
                seedData.withdrawTransactionId1_0,
                this.user1Address,
                seedData.withdraw1,
                seedData.invalidNonce,
                seedData.startDatePlus1m,
              ),
            ).revertedWithCustomError(this.owner2WEB3PaymentGateway, customError.invalidNonce);
          });

          it('user1 tries to call withdraw from contract without required funds', async function () {
            await expect(
              this.owner2WEB3PaymentGateway.withdraw(
                seedData.userId1,
                seedData.withdrawTransactionId1_0,
                this.user1Address,
                seedData.extraWithdraw1,
                seedData.withdrawNonce1_0,
                seedData.startDatePlus1m,
              ),
            ).revertedWithCustomError(
              this.owner2WEB3PaymentGateway,
              customError.contractMustHaveSufficientFunds,
            );
          });

          it('check hash collision for signMessageForWithdraw', async function () {
            const wrongSignature = await signMessageForWEB3PaymentGatewayWithdraw(
              this.owner2,
              '123',
              '123',
              this.user1Address,
              seedData.deposit1,
              seedData.withdrawNonce1_0,
              seedData.startDatePlus1m,
            );

            await expect(
              this.user1WEB3PaymentGateway.withdrawSig(
                '12',
                '3123',
                this.user1Address,
                seedData.deposit1,
                seedData.startDatePlus1m,
                wrongSignature,
              ),
            ).revertedWithCustomError(this.owner2WEB3PaymentGateway, customError.invalidSignature);
          });

          it('user1 is allowed to withdraw (check event)', async function () {
            const signature = await signMessageForWEB3PaymentGatewayWithdraw(
              this.owner2,
              seedData.userId1,
              seedData.withdrawTransactionId1_0,
              this.user1Address,
              seedData.withdraw1,
              seedData.withdrawNonce1_0,
              seedData.startDatePlus1m,
            );

            const receipt = await waitTx(
              this.user1WEB3PaymentGateway.withdrawSig(
                seedData.userId1,
                seedData.withdrawTransactionId1_0,
                this.user1Address,
                seedData.withdraw1,
                seedData.startDatePlus1m,
                signature,
              ),
            );
            const eventLog = findEvent<WithdrawEventArgs>(receipt);

            expect(eventLog).not.undefined;
            const [account, to, amount] = eventLog?.args;
            expect(account).eq(this.user1Address);
            expect(to).eq(this.user1Address);
            expect(amount).eq(seedData.withdraw1);
          });

          describe('user1 withdrew funds', () => {
            beforeEach(async function () {
              const signature = await signMessageForWEB3PaymentGatewayWithdraw(
                this.owner2,
                seedData.userId1,
                seedData.withdrawTransactionId1_0,
                this.user1Address,
                seedData.withdraw1,
                seedData.withdrawNonce1_0,
                seedData.startDatePlus1m,
              );

              await this.user1WEB3PaymentGateway.withdrawSig(
                seedData.userId1,
                seedData.withdrawTransactionId1_0,
                this.user1Address,
                seedData.withdraw1,
                seedData.startDatePlus1m,
                signature,
              );
            });

            it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
              const { withdrewAmount: userWithdrewAmount } =
                await this.user1WEB3PaymentGateway.fetchUserFundItem(seedData.userId1);
              expect(userWithdrewAmount).eq(seedData.withdraw1);

              const { withdrewAmount: accountWithdrewAmount } =
                await this.user1WEB3PaymentGateway.fetchAccountFundItem(this.user1Address);
              expect(accountWithdrewAmount).eq(seedData.withdraw1);

              expect(await this.owner2WEB3PaymentGateway.totalWithdrew()).eq(seedData.withdraw1);
              expect(await this.owner2WEB3PaymentGateway.calculateRemainWithdraw()).eq(
                contractConfig.withdrawGoal - seedData.withdraw1,
              );
              expect(await this.ownerWEB3PaymentGateway.getAccountCount()).eq(1);
            });

            it('user1 tries to call withdrawSig with the same transactionId', async function () {
              const signature = await signMessageForWEB3PaymentGatewayWithdraw(
                this.owner2,
                seedData.userId1,
                seedData.withdrawTransactionId1_0,
                this.user1Address,
                seedData.withdraw1,
                seedData.withdrawNonce1_1,
                seedData.startDatePlus1m,
              );

              await expect(
                this.user1WEB3PaymentGateway.withdrawSig(
                  seedData.userId1,
                  seedData.withdrawTransactionId1_0,
                  this.user1Address,
                  seedData.withdraw1,
                  seedData.startDatePlus1m,
                  signature,
                ),
              ).revertedWithCustomError(
                this.owner2WEB3PaymentGateway,
                customError.usedTransactionId,
              );
            });

            it('user1 tries to call withdrawSig with the same transactionId', async function () {
              await this.owner2ERC20Token.transfer(
                this.web3PaymentGatewayAddress,
                seedData.userInitBalance,
              );

              const extraWithdraw = seedData.extraWithdraw1 * BigInt(2);

              const signature = await signMessageForWEB3PaymentGatewayWithdraw(
                this.owner2,
                seedData.userId1,
                seedData.withdrawTransactionId1_1,
                this.user1Address,
                extraWithdraw,
                seedData.withdrawNonce1_1,
                seedData.startDatePlus1m,
              );

              await expect(
                this.user1WEB3PaymentGateway.withdrawSig(
                  seedData.userId1,
                  seedData.withdrawTransactionId1_1,
                  this.user1Address,
                  extraWithdraw,
                  seedData.startDatePlus1m,
                  signature,
                ),
              ).revertedWithCustomError(
                this.owner2WEB3PaymentGateway,
                customError.achievedWithdrawGoal,
              );
            });

            describe('set time after close date', () => {
              beforeEach(async function () {
                await time.increaseTo(
                  addSecondsToUnixTime(contractConfig.closeDate, seedData.timeShift),
                );
              });

              it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
                expect(await this.owner2WEB3PaymentGateway.getDepositRefundFetchReady()).eq(true);
              });
            });
          });

          describe('user2 deposited funds', () => {
            beforeEach(async function () {
              const nonce = await this.user2WEB3PaymentGateway.getDepositNonce(seedData.userId2);

              const signature = await signMessageForWEB3PaymentGatewayDeposit(
                this.owner2,
                seedData.userId2,
                seedData.depositTransactionId2_0,
                this.user2Address,
                seedData.deposit2_0,
                Number(nonce),
                seedData.startDatePlus1m,
              );

              await this.user2WEB3PaymentGateway.depositSig(
                seedData.userId2,
                seedData.depositTransactionId2_0,
                this.user2Address,
                seedData.deposit2_0,
                seedData.startDatePlus1m,
                signature,
              );
            });

            it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
              expect(await getERC20TokenBalance(this, this.user2Address)).eq(
                seedData.userInitBalance - seedData.deposit2_0,
              );

              expect(await this.owner2WEB3PaymentGateway.balanceOf(seedData.userId2)).eq(
                seedData.deposit2_0,
              );

              const { depositedAmount: userDepositedAmount } =
                await this.user1WEB3PaymentGateway.fetchUserFundItem(seedData.userId2);
              expect(userDepositedAmount).eq(seedData.deposit2_0);

              const { depositedAmount: accountDepositedAmount } =
                await this.user1WEB3PaymentGateway.fetchAccountFundItem(this.user2Address);
              expect(accountDepositedAmount).eq(seedData.deposit2_0);

              expect(await this.owner2WEB3PaymentGateway.totalDeposited()).eq(
                seedData.deposit1 + seedData.deposit2_0,
              );

              const transactionItem = await this.user2WEB3PaymentGateway.fetchTransactionItem(
                seedData.depositTransactionId2_0,
              );
              expect(transactionItem.amount).eq(seedData.deposit2_0);

              expect(await this.user1WEB3PaymentGateway.getDepositNonce(seedData.userId1)).eq(1);
              expect(await this.user2WEB3PaymentGateway.getDepositNonce(seedData.userId2)).eq(1);
              expect(await this.user1WEB3PaymentGateway.getWithdrawNonce(seedData.userId1)).eq(0);
              expect(await this.user2WEB3PaymentGateway.getWithdrawNonce(seedData.userId2)).eq(0);

              expect(await this.owner2WEB3PaymentGateway.calculateRemainWithdraw()).eq(
                contractConfig.withdrawGoal,
              );

              expect(await this.ownerWEB3PaymentGateway.getAccountCount()).eq(2);
              expect(await this.ownerWEB3PaymentGateway.getAccountByIndex(0)).eq(this.user1Address);
              expect(await this.ownerWEB3PaymentGateway.getAccountByIndex(1)).eq(this.user2Address);

              expect(
                await this.ownerWEB3PaymentGateway.getDepositRefundAllocation(this.user1Address),
              ).eq(seedData.zero);
              const {
                baseDeposited: baseDeposited1,
                boosted: boosted1,
                baseAllocation: baseAllocation1,
                baseRefund: baseRefund1,
                boostRefund: boostRefund1,
                nonce: nonce1,
              } = await this.ownerWEB3PaymentGateway.getDepositRefundAccountInfo(this.user1Address);
              expect(baseDeposited1).eq(seedData.deposit1);
              expect(boosted1).eq(false);
              expect(baseAllocation1).eq(seedData.zero);
              expect(baseRefund1).eq(seedData.deposit1);
              expect(boostRefund1).eq(seedData.zero);
              expect(nonce1).eq(1);

              expect(
                await this.ownerWEB3PaymentGateway.getDepositRefundAllocation(this.user2Address),
              ).eq(seedData.zero);
              const {
                baseDeposited: baseDeposited2,
                boosted: boosted2,
                baseAllocation: baseAllocation2,
                baseRefund: baseRefund2,
                boostRefund: boostRefund2,
                nonce: nonce2,
              } = await this.ownerWEB3PaymentGateway.getDepositRefundAccountInfo(this.user2Address);
              expect(baseDeposited2).eq(seedData.deposit2_0);
              expect(boosted2).eq(false);
              expect(baseAllocation2).eq(seedData.zero);
              expect(baseRefund2).eq(seedData.deposit2_0);
              expect(boostRefund2).eq(seedData.zero);
              expect(nonce2).eq(1);

              const { totalBaseDeposited } =
                await this.ownerWEB3PaymentGateway.getDepositRefundContractInfo();
              expect(totalBaseDeposited).eq(await this.ownerWEB3PaymentGateway.totalDeposited());
              expect(await this.ownerWEB3PaymentGateway.isReachedDepositGoal()).eq(false);

              expect(await this.ownerWEB3PaymentGateway.fetchUserAccounts(seedData.userId1)).eql([
                this.user1Address,
              ]);
              expect(await this.ownerWEB3PaymentGateway.fetchUserAccounts(seedData.userId2)).eql([
                this.user2Address,
              ]);

              expect(await this.ownerWEB3PaymentGateway.fetchUserAccounts(seedData.userId1)).eql([
                this.user1Address,
              ]);
              expect(await this.ownerWEB3PaymentGateway.fetchUserAccounts(seedData.userId2)).eql([
                this.user2Address,
              ]);
            });

            describe('user2 deposited again', () => {
              beforeEach(async function () {
                await this.user2ERC20Token.approve(
                  this.web3PaymentGatewayAddress,
                  seedData.deposit2_1,
                );

                const nonce = await this.user2WEB3PaymentGateway.getDepositNonce(seedData.userId2);

                const signature = await signMessageForWEB3PaymentGatewayDeposit(
                  this.owner2,
                  seedData.userId2,
                  seedData.depositTransactionId2_1,
                  this.user2Address,
                  seedData.deposit2_1,
                  Number(nonce),
                  seedData.startDatePlus1m,
                );

                await this.user2WEB3PaymentGateway.depositSig(
                  seedData.userId2,
                  seedData.depositTransactionId2_1,
                  this.user2Address,
                  seedData.deposit2_1,
                  seedData.startDatePlus1m,
                  signature,
                );
              });

              it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
                const newDeposit2 = seedData.deposit2_0 + seedData.deposit2_1;
                expect(await getERC20TokenBalance(this, this.user2Address)).eq(
                  seedData.userInitBalance - newDeposit2,
                );

                expect(await this.owner2WEB3PaymentGateway.balanceOf(seedData.userId2)).eq(
                  newDeposit2,
                );

                const { depositedAmount: userDepositedAmount } =
                  await this.user1WEB3PaymentGateway.fetchUserFundItem(seedData.userId2);
                expect(userDepositedAmount).eq(newDeposit2);

                const { depositedAmount: accountDepositedAmount } =
                  await this.user1WEB3PaymentGateway.fetchAccountFundItem(this.user2Address);
                expect(accountDepositedAmount).eq(newDeposit2);

                expect(await this.owner2WEB3PaymentGateway.totalDeposited()).eq(
                  seedData.deposit1 + newDeposit2,
                );

                const transactionItem = await this.user2WEB3PaymentGateway.fetchTransactionItem(
                  seedData.depositTransactionId2_1,
                );
                expect(transactionItem.amount).eq(seedData.deposit2_1);

                expect(await this.user1WEB3PaymentGateway.getDepositNonce(seedData.userId1)).eq(1);
                expect(await this.user2WEB3PaymentGateway.getDepositNonce(seedData.userId2)).eq(2);
                expect(await this.user1WEB3PaymentGateway.getWithdrawNonce(seedData.userId1)).eq(0);
                expect(await this.user2WEB3PaymentGateway.getWithdrawNonce(seedData.userId2)).eq(0);

                expect(await this.owner2WEB3PaymentGateway.calculateRemainWithdraw()).eq(
                  contractConfig.withdrawGoal,
                );

                expect(await this.ownerWEB3PaymentGateway.getAccountCount()).eq(2);
                expect(await this.ownerWEB3PaymentGateway.getAccountByIndex(0)).eq(
                  this.user1Address,
                );
                expect(await this.ownerWEB3PaymentGateway.getAccountByIndex(1)).eq(
                  this.user2Address,
                );

                expect(
                  await this.ownerWEB3PaymentGateway.getDepositRefundAllocation(this.user1Address),
                ).eq(seedData.deposit1);
                const {
                  baseDeposited: baseDeposited1,
                  boosted: boosted1,
                  baseAllocation: baseAllocation1,
                  baseRefund: baseRefund1,
                  boostRefund: boostRefund1,
                  nonce: nonce1,
                } = await this.ownerWEB3PaymentGateway.getDepositRefundAccountInfo(
                  this.user1Address,
                );
                expect(baseDeposited1).eq(seedData.deposit1);
                expect(boosted1).eq(false);
                expect(baseAllocation1).eq(seedData.deposit1);
                expect(baseRefund1).eq(seedData.zero);
                expect(boostRefund1).eq(seedData.zero);
                expect(nonce1).eq(1);

                expect(
                  await this.ownerWEB3PaymentGateway.getDepositRefundAllocation(this.user2Address),
                ).eq(newDeposit2);
                const {
                  baseDeposited: baseDeposited2,
                  boosted: boosted2,
                  baseAllocation: baseAllocation2,
                  baseRefund: baseRefund2,
                  boostRefund: boostRefund2,
                  nonce: nonce2,
                } = await this.ownerWEB3PaymentGateway.getDepositRefundAccountInfo(
                  this.user2Address,
                );
                expect(baseDeposited2).eq(newDeposit2);
                expect(boosted2).eq(false);
                expect(baseAllocation2).eq(newDeposit2);
                expect(baseRefund2).eq(seedData.zero);
                expect(boostRefund2).eq(seedData.zero);
                expect(nonce2).eq(2);

                const { totalBaseDeposited } =
                  await this.ownerWEB3PaymentGateway.getDepositRefundContractInfo();
                expect(totalBaseDeposited).eq(await this.ownerWEB3PaymentGateway.totalDeposited());
                expect(await this.ownerWEB3PaymentGateway.isReachedDepositGoal()).eq(true);

                expect(await this.ownerWEB3PaymentGateway.fetchUserAccounts(seedData.userId1)).eql([
                  this.user1Address,
                ]);
                expect(await this.ownerWEB3PaymentGateway.fetchUserAccounts(seedData.userId2)).eql([
                  this.user2Address,
                ]);
              });
            });

            describe('user2 deposited again as user3 account', () => {
              beforeEach(async function () {
                await this.owner2ERC20Token.transfer(this.user3Address, seedData.userInitBalance);
                await this.user3ERC20Token.approve(
                  this.web3PaymentGatewayAddress,
                  seedData.deposit2_1,
                );

                const nonce = await this.user2WEB3PaymentGateway.getDepositNonce(seedData.userId2);

                const signature = await signMessageForWEB3PaymentGatewayDeposit(
                  this.owner2,
                  seedData.userId2,
                  seedData.depositTransactionId2_1,
                  this.user3Address,
                  seedData.deposit2_1,
                  Number(nonce),
                  seedData.startDatePlus1m,
                );

                await this.user2WEB3PaymentGateway.depositSig(
                  seedData.userId2,
                  seedData.depositTransactionId2_1,
                  this.user3Address,
                  seedData.deposit2_1,
                  seedData.startDatePlus1m,
                  signature,
                );
              });

              it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
                const newDeposit2 = seedData.deposit2_0 + seedData.deposit2_1;
                expect(await getERC20TokenBalance(this, this.user3Address)).eq(
                  seedData.userInitBalance - seedData.deposit2_1,
                );

                expect(await this.owner2WEB3PaymentGateway.balanceOf(seedData.userId2)).eq(
                  newDeposit2,
                );

                const { depositedAmount: userDepositedAmount } =
                  await this.user1WEB3PaymentGateway.fetchUserFundItem(seedData.userId2);
                expect(userDepositedAmount).eq(newDeposit2);

                const { depositedAmount: userDepositedAmountByAccount } =
                  await this.user1WEB3PaymentGateway.fetchUserFundItemByAccount(this.user3Address);
                expect(userDepositedAmountByAccount).eq(newDeposit2);

                const { depositedAmount: accountDepositedAmount } =
                  await this.user1WEB3PaymentGateway.fetchAccountFundItem(this.user3Address);
                expect(accountDepositedAmount).eq(seedData.deposit2_1);

                expect(await this.owner2WEB3PaymentGateway.totalDeposited()).eq(
                  seedData.deposit1 + newDeposit2,
                );

                const transactionItem = await this.user2WEB3PaymentGateway.fetchTransactionItem(
                  seedData.depositTransactionId2_1,
                );
                expect(transactionItem.amount).eq(seedData.deposit2_1);

                expect(await this.user1WEB3PaymentGateway.getDepositNonce(seedData.userId1)).eq(1);
                expect(await this.user2WEB3PaymentGateway.getDepositNonce(seedData.userId2)).eq(2);
                expect(await this.user1WEB3PaymentGateway.getWithdrawNonce(seedData.userId1)).eq(0);
                expect(await this.user2WEB3PaymentGateway.getWithdrawNonce(seedData.userId2)).eq(0);

                expect(await this.owner2WEB3PaymentGateway.calculateRemainWithdraw()).eq(
                  contractConfig.withdrawGoal,
                );

                expect(await this.ownerWEB3PaymentGateway.getAccountCount()).eq(3);
                expect(await this.ownerWEB3PaymentGateway.getAccountByIndex(0)).eq(
                  this.user1Address,
                );
                expect(await this.ownerWEB3PaymentGateway.getAccountByIndex(1)).eq(
                  this.user2Address,
                );

                expect(
                  await this.ownerWEB3PaymentGateway.getDepositRefundAllocation(this.user1Address),
                ).eq(seedData.deposit1);
                const {
                  baseDeposited: baseDeposited1,
                  boosted: boosted1,
                  baseAllocation: baseAllocation1,
                  baseRefund: baseRefund1,
                  boostRefund: boostRefund1,
                  nonce: nonce1,
                } = await this.ownerWEB3PaymentGateway.getDepositRefundAccountInfo(
                  this.user1Address,
                );
                expect(baseDeposited1).eq(seedData.deposit1);
                expect(boosted1).eq(false);
                expect(baseAllocation1).eq(seedData.deposit1);
                expect(baseRefund1).eq(seedData.zero);
                expect(boostRefund1).eq(seedData.zero);
                expect(nonce1).eq(1);

                expect(
                  await this.ownerWEB3PaymentGateway.getDepositRefundAllocation(this.user2Address),
                ).eq(seedData.deposit2_0);
                const {
                  baseDeposited: baseDeposited2,
                  boosted: boosted2,
                  baseAllocation: baseAllocation2,
                  baseRefund: baseRefund2,
                  boostRefund: boostRefund2,
                  nonce: nonce2,
                } = await this.ownerWEB3PaymentGateway.getDepositRefundAccountInfo(
                  this.user2Address,
                );
                expect(baseDeposited2).eq(seedData.deposit2_0);
                expect(boosted2).eq(false);
                expect(baseAllocation2).eq(seedData.deposit2_0);
                expect(baseRefund2).eq(seedData.zero);
                expect(boostRefund2).eq(seedData.zero);
                expect(nonce2).eq(1);

                expect(
                  await this.ownerWEB3PaymentGateway.getDepositRefundAllocation(this.user3Address),
                ).eq(seedData.deposit2_1);
                const {
                  baseDeposited: baseDeposited3,
                  boosted: boosted3,
                  baseAllocation: baseAllocation3,
                  baseRefund: baseRefund3,
                  boostRefund: boostRefund3,
                  nonce: nonce3,
                } = await this.ownerWEB3PaymentGateway.getDepositRefundAccountInfo(
                  this.user3Address,
                );
                expect(baseDeposited3).eq(seedData.deposit2_1);
                expect(boosted3).eq(false);
                expect(baseAllocation3).eq(seedData.deposit2_1);
                expect(baseRefund3).eq(seedData.zero);
                expect(boostRefund3).eq(seedData.zero);
                expect(nonce3).eq(1);

                const { totalBaseDeposited } =
                  await this.ownerWEB3PaymentGateway.getDepositRefundContractInfo();
                expect(totalBaseDeposited).eq(await this.ownerWEB3PaymentGateway.totalDeposited());
                expect(await this.ownerWEB3PaymentGateway.isReachedDepositGoal()).eq(true);

                expect(await this.ownerWEB3PaymentGateway.fetchUserAccounts(seedData.userId1)).eql([
                  this.user1Address,
                ]);

                expect(await this.ownerWEB3PaymentGateway.fetchUserAccounts(seedData.userId2)).eql([
                  this.user2Address,
                  this.user3Address,
                ]);

                expect(
                  await this.ownerWEB3PaymentGateway.fetchSiblingAccounts(this.user1Address),
                ).eql([this.user1Address]);
                expect(
                  await this.ownerWEB3PaymentGateway.fetchSiblingAccounts(this.user2Address),
                ).eql([this.user2Address, this.user3Address]);
                expect(
                  await this.ownerWEB3PaymentGateway.fetchSiblingAccounts(this.user3Address),
                ).eql([this.user2Address, this.user3Address]);
              });
            });
          });
        });
      });
    });
  });
}
