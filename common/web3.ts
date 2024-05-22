import { TransactionResponse } from 'ethers';
// import { DeployNetworkKey } from '~common-service';
import { PostReceiver, Promisable } from './types';

export const MISSING_SERVICE_PRIVATE_KEY = `Service hasn't correct private key of smart-contract`;

// export async function getTxOverrides(
//   services: Services,
//   network: DeployNetworkKey,
//   gasPriceFactor = 1,
//   gasLimit = 200000,
// ): Promise<Overrides | null> {
//   const context = services.getNetworkContext(network);

//   if (!context) {
//     throw MISSING_SERVICE_PRIVATE_KEY;
//   }

//   const rawProvider = context?.rawProvider;

//   if (!rawProvider) {
//     return null;
//   }

//   const feeData = await rawProvider.getFeeData();
//   const gasPrice = ((feeData.gasPrice ?? BigInt(1)) * BigInt(gasPriceFactor)) / BigInt(100);

//   return {
//     gasPrice,
//     gasLimit,
//   };
// }

export async function waitTxEx(
  promise: Promise<TransactionResponse>,
  options?: {
    onStarted?: (tx: TransactionResponse) => Promisable<void>;
    onSuccess?: (tx: TransactionResponse) => Promisable<void>;
    onFail?: (err: any) => Promisable<void>;
    skipWait?: boolean;
  },
): Promise<TransactionResponse | null> {
  let tx = null;
  try {
    tx = await promise;
    if (options?.onStarted) {
      await options.onStarted(tx);
    }
    if (options?.skipWait) {
      return tx;
    }
    await tx.wait();
    if (options?.onSuccess) {
      await options.onSuccess(tx);
    }
  } catch (e) {
    if (options?.onFail) {
      await options.onFail(e);
    }
    throw e;
  }
  return tx;
}

export async function postInformTx(
  promise: Promise<TransactionResponse>,
  receiver: PostReceiver,
  onFinish?: (tx: TransactionResponse) => Promisable<void>,
): Promise<TransactionResponse> {
  const tx = await promise;
  receiver.inform(tx);
  if (onFinish) {
    tx.wait()
      .then(() => onFinish(tx))
      .catch(() => onFinish(tx));
  }
  return tx;
}

export function txResponse(tx: TransactionResponse) {
  return {
    hash: tx.hash,
  };
}
