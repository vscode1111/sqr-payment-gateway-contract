import { contractConfig, getContractArgs } from '~seeds';
import { verifyArgsRequired } from './deployData';

export function getContractArgsEx() {
  return verifyArgsRequired
    ? getContractArgs(
        contractConfig.newOwner,
        contractConfig.sqrToken,
        contractConfig.coldWallet,
        contractConfig.balanceLimit,
      )
    : undefined;
}
