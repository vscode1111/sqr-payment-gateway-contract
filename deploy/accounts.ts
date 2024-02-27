import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { FRACTION_DIGITS, getNetworkName, toNumber } from '~common';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  const name = getNetworkName(hre);

  console.log(`List of accounts in ${name}:`);
  const accounts: Signer[] = await hre.ethers.getSigners();

  let total = 0;

  const result = await Promise.all(
    accounts.map(async (account) => {
      const address = await account.getAddress();
      const balance = Number(
        toNumber(await ethers.provider.getBalance(address)).toFixed(FRACTION_DIGITS),
      );
      total += balance;
      return {
        address,
        balance,
      };
    }),
  );

  console.table(result);
  console.log(`total: ${total.toFixed(FRACTION_DIGITS)}`);
};

func.tags = ['accounts'];

export default func;
