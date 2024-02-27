import { expect } from 'chai';
import { TransactionReceipt } from 'ethers';
import { seedData } from '~seeds';
import { ContextBase } from '~types';

export async function getSQRTokenBalance(that: ContextBase, address: string) {
  return that.owner2SQRToken.balanceOf(address);
}

export async function checkTotalSQRBalance(that: ContextBase) {
  expect(
    await getTotalSQRBalance(that, [
      that.user1Address,
      that.user2Address,
      that.user3Address,
      that.ownerAddress,
      that.owner2Address,
      that.coldWalletAddress,
      that.sqrTokenAddress,
      that.sqrPaymentGatewayAddress,
    ]),
  ).eq(seedData.totalAccountBalance);
}

export async function getTotalSQRBalance(that: ContextBase, accounts: string[]): Promise<bigint> {
  const result = await Promise.all(accounts.map((address) => getSQRTokenBalance(that, address)));
  return result.reduce((acc, cur) => acc + cur, seedData.zero);
}

export function findEvent<T>(receipt: TransactionReceipt) {
  return receipt.logs.find((log: any) => log.fragment) as T;
}
