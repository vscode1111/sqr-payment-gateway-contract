export interface DeployNetworks {
  bsc: string;
}

export interface Addresses {
  web3PaymentGatewayAddress: string;
}

export type StringNumber = string | number;

export type DeployNetworkKey = keyof DeployNetworks;
