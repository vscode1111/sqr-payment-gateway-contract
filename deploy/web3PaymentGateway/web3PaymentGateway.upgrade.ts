import { upgrades } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, verifyContract } from '~common-contract';
import { WEB3_PAYMENT_GATEWAY_NAME } from '~constants';
import { getAddressesFromHre, getWEB3PaymentGatewayContext, getUsers } from '~utils';
import { verifyRequired } from './deployData';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { web3PaymentGatewayAddress } = getAddressesFromHre(hre);
    console.log(`${WEB3_PAYMENT_GATEWAY_NAME} ${web3PaymentGatewayAddress} is upgrading...`);
    const { owner2Web3PaymentGatewayFactory, owner2WEB3PaymentGateway } =
      await getWEB3PaymentGatewayContext(await getUsers(), web3PaymentGatewayAddress);

    const users = await getUsers();
    const { owner2Address } = users;

    const owner = await owner2WEB3PaymentGateway.owner();

    //Checks
    if (owner !== owner2Address) {
      console.error(`You aren't contract owner`);
      return;
    }

    await upgrades.upgradeProxy(web3PaymentGatewayAddress, owner2Web3PaymentGatewayFactory);
    console.log(`${WEB3_PAYMENT_GATEWAY_NAME} upgraded to ${web3PaymentGatewayAddress}`);
    if (verifyRequired) {
      await verifyContract(web3PaymentGatewayAddress, hre);
      console.log(
        `${WEB3_PAYMENT_GATEWAY_NAME} upgraded and verified to ${web3PaymentGatewayAddress}`,
      );
    }
  }, hre);
};

func.tags = [`${WEB3_PAYMENT_GATEWAY_NAME}:upgrade`];

export default func;
