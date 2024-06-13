import { TokenAddressDescription } from '~common-contract';
import { TOKENS_DESCRIPTIONS } from '~constants';

export function getTokenDescription(address: string): TokenAddressDescription {
  const tokenDescription = TOKENS_DESCRIPTIONS[address];

  return {
    ...tokenDescription,
    address,
  };
}
