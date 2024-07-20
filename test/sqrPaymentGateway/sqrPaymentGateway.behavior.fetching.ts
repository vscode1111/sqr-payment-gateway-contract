import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { CONTRACT_NAME, CONTRACT_VERSION } from '~constants';
import { contractConfig, seedData } from '~seeds';
import { addSecondsToUnixTime } from '~utils';
import { getERC20TokenBalance, loadSQRPaymentGatewayFixture } from './utils';

export function shouldBehaveCorrectFetching(): void {
  describe('fetching', () => {
    beforeEach(async function () {
      await loadSQRPaymentGatewayFixture(this);
    });

    it('should be correct init values', async function () {
      expect(await this.ownerSQRPaymentGateway.owner()).eq(this.owner2Address);
      expect(await this.ownerSQRPaymentGateway.getContractName()).eq(CONTRACT_NAME);
      expect(await this.ownerSQRPaymentGateway.getContractVersion()).eq(CONTRACT_VERSION);
      expect(await this.ownerSQRPaymentGateway.erc20Token()).eq(this.erc20TokenAddress);
      expect(await this.ownerSQRPaymentGateway.coldWallet()).eq(this.coldWalletAddress);
      expect(await this.ownerSQRPaymentGateway.balanceLimit()).eq(contractConfig.balanceLimit);

      expect(await this.ownerSQRPaymentGateway.isBeforeStartDate()).eq(true);
      expect(await this.ownerSQRPaymentGateway.isAfterCloseDate()).eq(false);
      expect(await this.ownerSQRPaymentGateway.isDepositReady()).eq(false);

      expect(await this.ownerSQRPaymentGateway.calculateRemainDeposit()).eq(seedData.zero);
      expect(await this.ownerSQRPaymentGateway.calculateRemainWithdraw()).eq(seedData.zero);

      await time.increaseTo(addSecondsToUnixTime(contractConfig.startDate, seedData.timeShift));

      expect(await this.ownerSQRPaymentGateway.calculateRemainDeposit()).eq(
        contractConfig.depositGoal,
      );
      expect(await this.ownerSQRPaymentGateway.calculateRemainWithdraw()).eq(
        contractConfig.withdrawGoal,
      );
    });

    it('should be correct balances', async function () {
      expect(await getERC20TokenBalance(this, this.owner2Address)).eq(seedData.totalAccountBalance);
      expect(await this.ownerSQRPaymentGateway.getBalance()).eq(seedData.zero);
      expect(await this.ownerSQRPaymentGateway.totalDeposited()).eq(seedData.zero);
      expect(await this.ownerSQRPaymentGateway.totalWithdrew()).eq(seedData.zero);
    });
  });
}
