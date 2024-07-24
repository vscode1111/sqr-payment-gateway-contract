import dayjs, { Dayjs } from 'dayjs';
import { Signer } from 'ethers';
import { signEncodedMessage, toUnixTime } from '~common';

export async function signMessageForSQRPaymentGatewayDeposit(
  signer: Signer,
  userId: string,
  transactionId: string,
  account: string,
  amount: bigint,
  nonce: number,
  timestampLimit: number,
) {
  return signEncodedMessage(
    signer,
    // userId,  transactionId, account, amount, nonce, timestampLimit
    ['string', 'string', 'address', 'uint256', 'uint32', 'uint32'],
    [userId, transactionId, account, amount, nonce, timestampLimit],
  );
}

export async function signMessageForSQRPaymentGatewayWithdraw(
  signer: Signer,
  userId: string,
  transactionId: string,
  account: string,
  amount: bigint,
  nonce: number,
  timestampLimit: number,
) {
  return signEncodedMessage(
    signer,
    // userId,  transactionId, to, amount, nonce, timestampLimit
    ['string', 'string', 'address', 'uint256', 'uint32', 'uint32'],
    [userId, transactionId, account, amount, nonce, timestampLimit],
  );
}

export function addSecondsToUnixTime(date: number | Dayjs, seconds: number) {
  if (typeof date === 'number')
    return toUnixTime(
      dayjs(date * 1000)
        .add(seconds, 'seconds')
        .toDate(),
    );

  return toUnixTime(date.add(seconds, 'seconds').toDate());
}
