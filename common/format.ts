import dayjs, { Dayjs } from 'dayjs';
import { BigNumberish, Numeric } from 'ethers';
import { DEFAULT_DECIMALS, MS_IN_SEC } from './constants';
import { toNumberDecimalsFixed } from './converts';

export function formatDate(date: Date | Dayjs | number): string {
  if (typeof date === 'number') {
    return dayjs(date * MS_IN_SEC)
      .utc()
      .format('YYYY-MM-DD HH:mm:ss');
  }

  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

export function formatToken(
  value: BigNumberish,
  decimals: Numeric = DEFAULT_DECIMALS,
  tokenName?: string,
): string {
  return `${toNumberDecimalsFixed(value, decimals)}${tokenName ? ` ${tokenName}` : ``}`;
}
