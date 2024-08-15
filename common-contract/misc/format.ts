import { BigNumberish, Numeric } from 'ethers';
import { DEFAULT_DECIMALS, formatDate, formatToken, secondsToDhms } from '~common';

export function formatContractToken(
  value: BigNumberish,
  decimals: Numeric,
  tokenName?: string,
): string {
  return `${value} (${formatToken(BigInt(value), decimals, tokenName)})`;
}

export function formatContractDate(value: BigNumberish): string {
  const internalValue = Number(value);
  return `${internalValue} (${formatDate(internalValue)})`;
}

export function printToken(
  value: BigNumberish,
  decimals: number = DEFAULT_DECIMALS,
  tokenName?: string,
): string {
  return `${value} (${formatToken(value, decimals, tokenName)})`;
}

export function printDuration(value: number): string {
  return `${value} (${secondsToDhms(value)})`;
}

export function printDate(value: BigNumberish): string {
  const internalValue = Number(value);
  return `${internalValue} (${formatDate(internalValue)})`;
}
