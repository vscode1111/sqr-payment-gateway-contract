import { formatDate, formatToken } from '~common';

export function printToken(value: bigint, decimals: number, tokenName?: string): string {
  return `${value} (${formatToken(value, decimals, tokenName)})`;
}

export function printDate(value: number | bigint): string {
  const internalValue = Number(value);
  return `${internalValue} (${formatDate(internalValue)})`;
}
