import {
  ChangeBalanceLimitEvent,
  DepositEvent,
  ForceWithdrawEvent,
  WithdrawEvent,
} from '~typechain-types/contracts/WEB3PaymentGateway';
import { ContextBase } from '~types';

type Fixture<T> = () => Promise<T>;

declare module 'mocha' {
  export interface Context extends ContextBase {
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
  }
}

export interface EventArgs<T> {
  args: T;
}

export type ChangeBalanceLimitArgs = ChangeBalanceLimitEvent.Event & EventArgs<[string, bigint]>;

export type DepositEventArgs = DepositEvent.Event & EventArgs<[string, number]>;

export type WithdrawEventArgs = WithdrawEvent.Event & EventArgs<[string, string, number]>;

export type ForceWithdrawEventArgs = ForceWithdrawEvent.Event & EventArgs<[string, string, number]>;
