import { toUnixTime, toWei } from '~common';
import { sqrDecimals } from '~seeds';

export const verifyRequired = false;
export const verifyArgsRequired = false;

export const deployData = {
  userId1: 'tu1-f75c73b1-0f13-46ae-88f8-2048765c5ad4',
  userId2: 'tu2-cde2c184-165e-448d-a53a-a82b74a1eef7',
  now: toUnixTime(),
  nullAddress: '0x0000000000000000000000000000000000000000',
  userMintAmount: 100000,
  balanceLimit: toWei(1, sqrDecimals),
};
