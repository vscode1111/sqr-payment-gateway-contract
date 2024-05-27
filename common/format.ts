import dayjs, { Dayjs } from 'dayjs';
import { MS_IN_SEC } from './constants';
import { toNumberDecimals } from './converts';

export function formatDate(date: Date | Dayjs | number): string {
  if (typeof date === 'number') {
    return dayjs(date * MS_IN_SEC)
      .utc()
      .format('YYYY-MM-DD HH:mm:ss');
  }

  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

export function formatToken(value: bigint, decimals: number, tokenName?: string): string {
  return `${toNumberDecimals(value, decimals)}${tokenName ? ` ${tokenName}` : ``}`;
}
