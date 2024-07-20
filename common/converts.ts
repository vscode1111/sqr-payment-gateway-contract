import Decimal from 'decimal.js';
import { BigNumberish, Numeric, formatEther, formatUnits, parseUnits } from 'ethers';
import { StringNumber } from './types';

export const DECIMAL_FACTOR = 1e18;

export function toWei(value: BigNumberish, unitName?: BigNumberish): bigint {
  return BigInt(parseUnits(String(value), unitName));
}

export function toWeiWithFixed(value: BigNumberish, unitName?: BigNumberish): bigint {
  let newValue = value;
  if (typeof value === 'number' && (typeof unitName === 'number' || typeof unitName === 'bigint')) {
    newValue = new Decimal(String(value)).toFixed(Number(unitName));
  }

  return BigInt(parseUnits(String(newValue), unitName));
}

export function toNumberFixed(value: StringNumber, fractionDigits = 3): number {
  return Number(Number(value).toFixed(fractionDigits));
}

export function toNumber(value: bigint, factor = 1): number {
  return Number(formatEther(value)) * factor;
}

export function toNumberDecimals(value: BigNumberish, decimals: Numeric = 18): number {
  return Number(formatUnits(value, decimals));
}

export function toNumberDecimalsFixed(
  value: BigNumberish,
  decimals: Numeric = 18,
  fractionDigits = 3,
): number {
  return toNumberFixed(toNumberDecimals(value, decimals), fractionDigits);
}

export function toDec(value: string | undefined): number {
  if (!value) {
    return 0;
  }
  return parseInt(value);
}

export function toTinyDec(value: string, factor = DECIMAL_FACTOR): number {
  return toDec(value) / factor;
}

export function toHex(value: number | undefined): string {
  if (!value) {
    return '0x0';
  }
  return `0x${value.toString(16)}`;
}

export function toDate(value: StringNumber): Date {
  return typeof value === 'string' ? new Date(toDec(value) * 1000) : new Date(value * 1000);
}

export function getAddressFromSlot(value: string) {
  return `0x${value.slice(26, 66)}`;
}

export function toBoolean(value: string | undefined): boolean {
  return value?.toLowerCase() === 'true';
}

export function toBoolean2(value: StringNumber | boolean): boolean {
  return !!value;
}
