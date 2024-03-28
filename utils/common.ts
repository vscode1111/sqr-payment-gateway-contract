import { Signer } from 'ethers';
import { signEncodedMessage } from '~common';

export async function signMessageForDeposit(
  signer: Signer,
  userId: string,
  transactionId: string,
  account: string,
  amount: bigint,
  timestampLimit: number,
) {
  return signEncodedMessage(
    signer,
    // userId,  transactionId, account, amount, timestampLimit
    ['string', 'string', 'address', 'uint256', 'uint32'],
    [userId, transactionId, account, amount, timestampLimit],
  );
}

export async function signMessageForWithdraw(
  signer: Signer,
  userId: string,
  transactionId: string,
  to: string,
  amount: bigint,
  timestampLimit: number,
) {
  return signEncodedMessage(
    signer,
    // userId,  transactionId, to, amount, timestampLimit
    ['string', 'string', 'address', 'uint256', 'uint32'],
    [userId, transactionId, to, amount, timestampLimit],
  );
}
