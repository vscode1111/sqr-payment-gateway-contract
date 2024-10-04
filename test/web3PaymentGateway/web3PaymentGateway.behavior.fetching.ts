import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ZeroAddress } from 'ethers';
import { CONTRACT_NAME, CONTRACT_VERSION } from '~constants';
import { contractConfig, seedData } from '~seeds';
import { addSecondsToUnixTime } from '~utils';
import { getERC20TokenBalance, loadWEB3PaymentGatewayFixture } from './utils';

export function shouldBehaveCorrectFetching(): void {
  describe('fetching', () => {
    beforeEach(async function () {
      await loadWEB3PaymentGatewayFixture(this);
    });

    it('should be correct init values', async function () {
      expect(await this.ownerWEB3PaymentGateway.owner()).eq(this.owner2Address);
      expect(await this.ownerWEB3PaymentGateway.getContractName()).eq(CONTRACT_NAME);
      expect(await this.ownerWEB3PaymentGateway.getContractVersion()).eq(CONTRACT_VERSION);
      expect(await this.ownerWEB3PaymentGateway.getBaseGoal()).eq(
        await this.ownerWEB3PaymentGateway.depositGoal(),
      );
      expect(await this.ownerWEB3PaymentGateway.getStartDate()).eq(
        await this.ownerWEB3PaymentGateway.startDate(),
      );
      expect(await this.ownerWEB3PaymentGateway.getCloseDate()).eq(
        await this.ownerWEB3PaymentGateway.closeDate(),
      );
      expect(await this.ownerWEB3PaymentGateway.getDepositRefundFetchReady()).eq(false);
      expect(await this.ownerWEB3PaymentGateway.getAccountCount()).eq(0);

      const { baseToken, boostToken } =
        await this.ownerWEB3PaymentGateway.getDepositRefundTokensInfo();
      expect(baseToken).eq(await this.ownerWEB3PaymentGateway.erc20Token());
      expect(boostToken).eq(ZeroAddress);

      expect(await this.ownerWEB3PaymentGateway.erc20Token()).eq(this.erc20TokenAddress);
      expect(await this.ownerWEB3PaymentGateway.coldWallet()).eq(this.coldWalletAddress);
      expect(await this.ownerWEB3PaymentGateway.balanceLimit()).eq(contractConfig.balanceLimit);

      expect(await this.ownerWEB3PaymentGateway.isBeforeStartDate()).eq(true);
      expect(await this.ownerWEB3PaymentGateway.isAfterCloseDate()).eq(false);
      expect(await this.ownerWEB3PaymentGateway.isDepositReady()).eq(false);

      expect(await this.ownerWEB3PaymentGateway.calculateRemainDeposit()).eq(seedData.zero);
      expect(await this.ownerWEB3PaymentGateway.calculateRemainWithdraw()).eq(seedData.zero);

      await time.increaseTo(addSecondsToUnixTime(contractConfig.startDate, seedData.timeShift));

      expect(await this.ownerWEB3PaymentGateway.calculateRemainDeposit()).eq(
        contractConfig.depositGoal,
      );
      expect(await this.ownerWEB3PaymentGateway.calculateRemainWithdraw()).eq(
        contractConfig.withdrawGoal,
      );

      expect(await this.ownerWEB3PaymentGateway.fetchUserAccounts(seedData.userId1)).eql([]);
      expect(await this.ownerWEB3PaymentGateway.fetchUserAccounts(seedData.userId2)).eql([]);
    });

    it('should be correct balances', async function () {
      expect(await getERC20TokenBalance(this, this.owner2Address)).eq(seedData.totalAccountBalance);
      expect(await this.ownerWEB3PaymentGateway.getBalance()).eq(seedData.zero);
      expect(await this.ownerWEB3PaymentGateway.totalDeposited()).eq(seedData.zero);
      expect(await this.ownerWEB3PaymentGateway.totalWithdrew()).eq(seedData.zero);
    });
  });
}
