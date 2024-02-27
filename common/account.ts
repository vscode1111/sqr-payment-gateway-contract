import { HDNodeWallet } from 'ethers';
import { ethers } from 'hardhat';

export async function generateRandomWallet(): Promise<HDNodeWallet> {
  return ethers.Wallet.createRandom();
}
