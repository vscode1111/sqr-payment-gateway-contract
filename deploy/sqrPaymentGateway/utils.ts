import { printDate, printToken } from '~common-contract';
import { ContractConfig, chainTokenDescription, contractConfig, getContractArgs } from '~seeds';
import { verifyArgsRequired } from './deployData';

export function getContractArgsEx() {
  return verifyArgsRequired ? getContractArgs(contractConfig) : undefined;
}

export function formatContractConfig(contractConfig: ContractConfig) {
  const { decimals, tokenName } = chainTokenDescription.bsc;
  const { depositGoal, withdrawGoal, balanceLimit, startDate, closeDate } = contractConfig;

  return {
    ...contractConfig,
    depositGoal: printToken(depositGoal, decimals, tokenName),
    withdrawGoal: printToken(withdrawGoal, decimals, tokenName),
    balanceLimit: printToken(balanceLimit, decimals, tokenName),
    startDate: printDate(startDate),
    closeDate: printDate(closeDate),
  };
}
