import { expect } from 'chai';
import dayjs, { Dayjs } from 'dayjs';
import { IdLock, Lock } from './Lock';
import { commonTestValue } from './constants';
import { sleep } from './misc';
import { StringNumber } from './types';

const lock = new Lock();
const idLock = new IdLock();

const TASK_COUNT = 5;

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

const LOGGING = false;

interface ResultData {
  taskId: StringNumber;
  date: Dayjs;
}

interface ExpectedData {
  taskId: StringNumber;
  diff: number;
}

async function simulateFn(taskId: StringNumber): Promise<Dayjs> {
  await sleep(1000);
  const date = dayjs();
  if (LOGGING) {
    console.log(`${taskId} ${date.format(DATE_FORMAT)}`);
  }
  return date;
}

async function threadSafeFn(taskId: StringNumber): Promise<Dayjs> {
  await lock.acquire();
  try {
    return await simulateFn(taskId);
  } finally {
    lock.release();
  }
}

async function threadSafeIdFn(taskId: StringNumber): Promise<Dayjs> {
  const release = await idLock.acquire(taskId);
  try {
    return await simulateFn(taskId);
  } finally {
    release();
  }
}

describe('Lock', () => {
  it('Lock', async function () {
    const tasks = Array(TASK_COUNT)
      .fill(null)
      .map((_, i) => i);

    const results: ResultData[] = [];

    await Promise.all(
      tasks.map(async (taskId) => {
        const date = await threadSafeFn(taskId);
        results.push({ taskId, date });
      }),
    );

    if (LOGGING) {
      console.log('--log');
    }
    const date0 = dayjs();
    results.forEach(({ taskId, date }) => {
      const diff = date0.diff(date, 'second');
      expect(diff).eq(TASK_COUNT - Number(taskId) - 1);
      if (LOGGING) {
        console.log(`${taskId} ${date.format(DATE_FORMAT)}, ${diff}`);
      }
    });
  }).timeout(commonTestValue.timeout);

  it.skip('IdLock', async function () {
    const tasks = Array(TASK_COUNT)
      .fill(null)
      .map((_, i) => i);

    tasks.splice(2, 0, 1);
    tasks.splice(3, 0, 4);

    const results: ResultData[] = [];

    await Promise.all(
      tasks.map(async (taskId) => {
        const date = await threadSafeIdFn(taskId);
        results.push({ taskId, date });
      }),
    );

    if (LOGGING) {
      console.log('--log');
    }

    const expectedData: ExpectedData[] = [
      { taskId: 0, diff: 1 },
      { taskId: 1, diff: 1 },
      { taskId: 4, diff: 1 },
      { taskId: 2, diff: 1 },
      { taskId: 3, diff: 1 },
      { taskId: 1, diff: 0 },
      { taskId: 4, diff: 0 },
    ];

    const date0 = dayjs();
    results.forEach(({ taskId, date }, index) => {
      const diff = date0.diff(date, 'second');
      const expected = expectedData[index];
      expect(taskId).eq(expected.taskId);
      expect(diff).eq(expected.diff);
      if (LOGGING) {
        console.log(`${taskId} ${date.format(DATE_FORMAT)}, ${diff}`);
      }
    });
  }).timeout(commonTestValue.timeout);
});
