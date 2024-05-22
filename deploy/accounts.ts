import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { toNumber } from '~common';
import { FRACTION_DIGITS, getNetworkName } from '~common-contract';
import { getUsers } from '~utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  const name = getNetworkName(hre);

  const users = await getUsers();
  const userNames = Object.keys(users);
  const addressUserMap = new Map<string, string>();

  userNames.forEach((name) => {
    const record = (users as any)[name];
    if (record instanceof HardhatEthersSigner) {
      const signer = record as HardhatEthersSigner;
      addressUserMap.set(signer.address, name);
    }
  });

  console.log(`List of accounts in ${name}:`);
  const accounts: Signer[] = await hre.ethers.getSigners();

  let total = 0;

  const result = await Promise.all(
    accounts.map(async (account) => {
      const address = await account.getAddress();
      const name = addressUserMap.get(address) ?? '';
      const balance = Number(
        toNumber(await ethers.provider.getBalance(address)).toFixed(FRACTION_DIGITS),
      );
      total += balance;
      return {
        name,
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
