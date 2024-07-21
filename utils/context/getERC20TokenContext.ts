import { ethers } from 'hardhat';
import { ERC20_TOKEN_NAME } from '~constants';
import { getTokenArgs } from '~seeds';
import { ERC20Token } from '~typechain-types/contracts/ERC20Token';
import { ERC20Token__factory } from '~typechain-types/factories/contracts/ERC20Token__factory';
import { ERC20TokenContext, Users } from '~types';

export async function getERC20TokenContext(
  users: Users,
  deployData?: string | { newOwner: string },
): Promise<ERC20TokenContext> {
  const { owner, user1, user2, user3, owner2, owner2Address, coldWallet } = users;

  const testERC20TokenFactory = (await ethers.getContractFactory(
    ERC20_TOKEN_NAME,
  )) as unknown as ERC20Token__factory;

  let ownerERC20Token: ERC20Token;

  if (typeof deployData === 'string') {
    ownerERC20Token = testERC20TokenFactory.connect(owner).attach(deployData) as ERC20Token;
  } else {
    const newOwner = deployData?.newOwner ?? owner2Address;
    ownerERC20Token = await testERC20TokenFactory.connect(owner).deploy(...getTokenArgs(newOwner));
  }

  const erc20TokenAddress = await ownerERC20Token.getAddress();

  const user1ERC20Token = ownerERC20Token.connect(user1);
  const user2ERC20Token = ownerERC20Token.connect(user2);
  const user3ERC20Token = ownerERC20Token.connect(user3);
  const owner2ERC20Token = ownerERC20Token.connect(owner2);
  const coldWalletERC20Token = ownerERC20Token.connect(coldWallet);

  return {
    erc20TokenAddress,
    ownerERC20Token,
    user1ERC20Token,
    user2ERC20Token,
    user3ERC20Token,
    owner2ERC20Token,
    coldWalletERC20Token,
  };
}
