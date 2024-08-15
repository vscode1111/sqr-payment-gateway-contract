import Bluebird from 'bluebird';
import { Promisable } from '~common';

export async function runConcurrently(
  fn: (taskId: number) => Promisable<void>,
  taskCount: number,
  concurrencyCount = 10,
  printStep = 10,
) {
  const tasks = Array(taskCount)
    .fill(null)
    .map((_, i) => i);

  const t0 = new Date().getTime();

  let c0 = new Date().getTime();

  await Bluebird.map(
    tasks,
    async (task) => {
      await fn(task);

      if (task % printStep === 0) {
        const diff = (new Date().getTime() - c0) / 1000;
        const rps = printStep / diff;
        console.log(`current task: ${task} in ${diff.toFixed(2)} s, rps: ${rps.toFixed(2)}`);
        c0 = new Date().getTime();
      }
    },
    { concurrency: concurrencyCount },
  );

  const diff = (new Date().getTime() - t0) / 1000;
  const rps = taskCount / diff;
  console.log(
    `Total: ${taskCount} requests (${concurrencyCount} concurrencies) in ${diff.toFixed(
      2,
    )} s, rps: ${rps.toFixed(2)}`,
  );
}
