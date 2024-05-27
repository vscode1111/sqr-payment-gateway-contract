export const waitUntil = (
  predicate: () => any,
  interval: number = 1000,
  timeout: number = -1,
): Promise<any> => {
  const timerInterval = interval;
  const timerTimeout = timeout;

  return new Promise((resolve, reject) => {
    let timer: any;
    let timeoutTimer: any;

    const clearTimers = () => {
      clearTimeout(timeoutTimer);
      clearInterval(timer);
    };

    const doStep = async () => {
      let result;

      try {
        result = await predicate();

        if (result) {
          clearTimers();
          resolve(result);
        } else {
          timer = setTimeout(doStep, timerInterval);
        }
      } catch (e) {
        clearTimers();
        reject(e);
      }
    };

    doStep();
    timer = setTimeout(doStep, timerInterval);

    if (timeout !== -1) {
      timeoutTimer = setTimeout(() => {
        clearTimers();
        reject(new Error(`Timed out after waiting for ${timerTimeout} ms`));
      }, timerTimeout);
    }
  });
};

export function secondsToDhms(seconds: number): string {
  seconds = Number(seconds);
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const result: string[] = [];

  if (d > 0) {
    result.push(`${d}d`);
  }
  if (d > 0 || h > 0) {
    result.push(`${h}h`);
  }
  if (h > 0 || m > 0) {
    result.push(`${m}m`);
  }
  if (m > 0 || s > 0) {
    result.push(`${s}s`);
  }

  return result.join(' ');
}

export function calculateDiffSecFromNow(date: Date) {
  return Math.floor((new Date().getTime() - date.getTime()) / 1000);
}
