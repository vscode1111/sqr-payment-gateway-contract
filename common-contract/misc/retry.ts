import { sleep } from '~common';

interface RetryParams<T> {
  fn: () => Promise<T>;
  maxAttempts?: number;
  smartDelay?: boolean;
  printError?: boolean;
}

export async function retry<T>({
  fn,
  maxAttempts = 3,
  smartDelay = true,
  printError: print,
}: RetryParams<T>) {
  async function execute(attempt: number) {
    try {
      return await fn();
    } catch (err) {
      if (attempt <= maxAttempts) {
        const nextAttempt = attempt + 1;
        if (smartDelay) {
          const delayInSeconds = Math.max(
            Math.min(Math.pow(2, nextAttempt) + randomInteger(-nextAttempt, nextAttempt), 600),
            1,
          );
          await sleep(delayInSeconds * 1000);
        }

        if (print) {
          console.log(`Attempt #${attempt}`, err);
        }
        return execute(nextAttempt);
      } else {
        throw err;
      }
    }
  }

  return execute(1);
}

export function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
