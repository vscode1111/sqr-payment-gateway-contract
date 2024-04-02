import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { SQR_PAYMENT_GATEWAY_NAME } from '~constants';
import { shouldBehaveCorrectDeployment } from './sqrPaymentGateway.behavior.deployment';
import { shouldBehaveCorrectFetching } from './sqrPaymentGateway.behavior.fetching';
import { shouldBehaveCorrectFunding } from './sqrPaymentGateway.behavior.funding';

describe(SQR_PAYMENT_GATEWAY_NAME, function () {
  before(async function () {
    this.loadFixture = loadFixture;
  });

  shouldBehaveCorrectDeployment();
  shouldBehaveCorrectFetching();
  shouldBehaveCorrectFunding();
});
