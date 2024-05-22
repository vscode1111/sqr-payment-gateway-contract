import { HDNodeWallet, Wallet, ethers } from 'ethers';
import { ApiError } from './checks';
import { keccak256FromStr } from './cryptography';

export async function generateRandomWallet(): Promise<HDNodeWallet> {
  return Wallet.createRandom();
}

export function generateRandomWalletByPrivateKey(
  privateKey: string,
  salt: string,
  rawProvider: ethers.JsonRpcProvider,
): ethers.Wallet {
  const newPrivateKey = keccak256FromStr(`${privateKey}-${salt}`);
  const wallet = new ethers.Wallet(newPrivateKey, rawProvider);
  const isAddress = ethers.isAddress(wallet.address);
  if (!isAddress) {
    throw new ApiError('Not valid EVM address was generated', 500);
  }
  return wallet;
}

export function sanitizePrivateKey(key: string): string {
  return key.replace('0x', '');
}
