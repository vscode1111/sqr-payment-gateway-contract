import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { WEB3_PAYMENT_GATEWAY_NAME } from '~constants';
import { shouldBehaveCorrectDeployment } from './web3PaymentGateway.behavior.deployment';
import { shouldBehaveCorrectFetching } from './web3PaymentGateway.behavior.fetching';
import { shouldBehaveCorrectFunding } from './web3PaymentGateway.behavior.funding';

describe(WEB3_PAYMENT_GATEWAY_NAME, function () {
  before(async function () {
    this.loadFixture = loadFixture;
  });

  shouldBehaveCorrectDeployment();
  shouldBehaveCorrectFetching();
  shouldBehaveCorrectFunding();
});
