import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { SQR_PAYMENT_GATEWAY_NAME } from '~constants';
import { ContextBase } from '~types';
import { shouldBehaveCorrectControl } from './sqrPaymentGateway.behavior.control';
import { shouldBehaveCorrectFetching } from './sqrPaymentGateway.behavior.fetching';
import { shouldBehaveCorrectFunding } from './sqrPaymentGateway.behavior.funding';
import { deploySQRPaymentGatewayContractFixture } from './sqrPaymentGateway.fixture';

describe(SQR_PAYMENT_GATEWAY_NAME, function () {
  before(async function () {
    this.loadFixture = loadFixture;
  });

  beforeEach(async function () {
    const fixture = await this.loadFixture(deploySQRPaymentGatewayContractFixture);
    for (const field in fixture) {
      this[field] = fixture[field as keyof ContextBase];
    }
  });

  shouldBehaveCorrectControl();
  shouldBehaveCorrectFetching();
  shouldBehaveCorrectFunding();
});
