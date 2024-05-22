import { TransactionResponse } from 'ethers';

export type StringNumber = string | number;

export type Promisable<T> = T | Promise<T>;

export interface PostReceiver {
  inform: (tx: TransactionResponse) => Promise<void>;
}

export interface Initialized {
  init: () => Promisable<any>;
}

export interface Started {
  start: () => Promisable<any>;
}

export interface Stopped {
  stop: () => Promisable<any>;
}

export interface EventNotifier<T> {
  send: (event: T) => Promise<void>;
}

export interface JsonMetadata {
  name: string;
  image: string;
  banner?: string;
  description: string;
}

export interface ContractData {
  name: string;
  symbol: string;
  uri?: string;
}
