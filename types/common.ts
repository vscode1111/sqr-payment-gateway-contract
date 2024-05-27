export interface DeployNetworks {
  bsc: string;
}

export interface Addresses {
  sqrPaymentGatewayAddress: string;
}

export type StringNumber = string | number;

export type DeployNetworkKey = keyof DeployNetworks;

export interface TokenDescription {
  tokenName: string;
  decimals: number;
}

export interface TokenAddressDescription extends TokenDescription {
  address: string;
}
