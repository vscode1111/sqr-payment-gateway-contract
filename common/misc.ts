export function parseError(error: any) {
  if (!error) {
    return;
  }

  if (typeof error === 'string') {
    return error;
  }

  if ('reason' in error) {
    return error.reason;
  }

  if ('message' in error) {
    return error.message;
  }

  return error;
}

export function parseStack(error: any) {
  if (!error) {
    return;
  }

  if (typeof error === 'object' && 'stack' in error) {
    return error.stack;
  }
}

export function incrementChangeHexChar(char: string): string {
  return (Number(`0x${char}`) + 1).toString(16).slice(-1);
}

export function toUnixTime(value: string | Date = new Date()): number {
  return Math.floor(new Date(value).getTime() / 1000);
}

export function toUnixTimeUtc(value: string | Date = new Date()): number {
  const date = new Date(value);
  return Math.floor((date.getTime() - date.getTimezoneOffset() * 60000) / 1000);
}

export function numberToByteArray(value: number, bytesNumber = 4): number[] {
  var byteArray = new Array(bytesNumber).fill(0);

  for (var index = byteArray.length - 1; index >= 0; index--) {
    var byte = value & 0xff;
    byteArray[index] = byte;
    value = (value - byte) / 256;
  }

  return byteArray;
}

export function byteArrayToNumber(byteArray: number[]): number {
  var value = 0;
  for (var i = byteArray.length - 1; i >= 0; i--) {
    value = value * 256 + byteArray[i];
  }

  return value;
}

export function printJson(value: any) {
  return JSON.stringify(value, null, 2);
}

export async function sleep(ms: number): Promise<number> {
  return new Promise((resolve) => setTimeout(resolve as any, ms));
}

export async function attempt(fn: () => Promise<any>, attempts = 3, delayMs = 1000): Promise<any> {
  try {
    return await fn();
  } catch (e) {
    if (attempts > 0) {
      console.log(e);
      await sleep(delayMs);
      // console.log(`${attempts - 1} attempts left`);
      return await attempt(fn, attempts - 1, delayMs);
    } else {
      throw e;
    }
  }
}
