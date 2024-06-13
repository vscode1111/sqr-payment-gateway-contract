export interface TokenDescription {
  tokenName: string;
  decimals: number;
}

export interface TokenAddressDescription extends TokenDescription {
  address: string;
}
