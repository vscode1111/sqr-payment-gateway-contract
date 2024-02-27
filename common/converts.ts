import { BigNumberish, formatEther, formatUnits, parseUnits } from 'ethers';
import { StringNumber } from './types';

export function toWei(value: BigNumberish, unitName?: BigNumberish): bigint {
  return BigInt(parseUnits(String(value), unitName));
}

export function toNumber(value: BigNumberish, factor = 1): number {
  return Number(formatEther(value)) * factor;
}

export function toNumberDecimals(value: BigNumberish, decimals = 18): number {
  return Number(formatUnits(value, decimals));
}

export function toDec(value: string | undefined): number {
  if (!value) {
    return 0;
  }
  return parseInt(value);
}

export function toDate(value: StringNumber): Date {
  return typeof value === 'string' ? new Date(toDec(value) * 1000) : new Date(value * 1000);
}

export function toBoolean(value: string | undefined): boolean {
  return value?.toLowerCase() === 'true';
}

export function toBoolean2(value: StringNumber | boolean): boolean {
  return !!value;
}
