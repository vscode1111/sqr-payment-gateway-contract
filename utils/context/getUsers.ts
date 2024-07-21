import { ethers } from 'hardhat';
import { Users } from '~types';

export async function getUsers(): Promise<Users> {
  const [owner, user1, user2, user3, owner2, coldWallet, depositVerifier, withdrawVerifier] =
    await ethers.getSigners();

  const ownerAddress = await owner.getAddress();
  const user1Address = await user1.getAddress();
  const user2Address = await user2.getAddress();
  const user3Address = await user3.getAddress();
  const owner2Address = await owner2.getAddress();
  const coldWalletAddress = await coldWallet.getAddress();
  const depositVerifierAddress = await depositVerifier.getAddress();
  const withdrawVerifierAddress = await withdrawVerifier.getAddress();

  return {
    owner,
    ownerAddress,
    user1,
    user1Address,
    user2,
    user2Address,
    user3,
    user3Address,
    owner2,
    owner2Address,
    coldWallet,
    coldWalletAddress,
    depositVerifier,
    depositVerifierAddress,
    withdrawVerifier,
    withdrawVerifierAddress,
  };
}
