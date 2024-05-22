import { expect } from 'chai';
import { SpeedCounter } from './SpeedCounter';
import { commonTestValue } from './constants';
import { sleep } from './misc';

describe('SpeedCounter', () => {
  it('stats calculation should be done correctly', async function () {
    const speedCounter = new SpeedCounter();
    let stats = speedCounter.stats();
    expect(stats).to.eql({ counterDiff: 0, timeDiff: 0, speed: 0 });

    const sleepMs = 200;
    const errorMs = 30;

    speedCounter.store(100);
    stats = speedCounter.stats();
    expect(stats.counterDiff).to.eql(100);
    expect(stats.timeDiff).to.closeTo(0, errorMs);

    await sleep(sleepMs);
    speedCounter.store(300);
    stats = speedCounter.stats();
    expect(stats.counterDiff).to.eql(200);
    expect(stats.timeDiff).to.closeTo(sleepMs, errorMs);
    expect(stats.speed).to.closeTo(1000, 100);

    await sleep(sleepMs);
    speedCounter.store(300);
    stats = speedCounter.stats();
    expect(stats.counterDiff).to.eql(0);
    expect(stats.timeDiff).to.closeTo(sleepMs, errorMs);
    expect(stats.speed).to.eql(0);

    expect(stats).to.not.eq(undefined);
  }).timeout(commonTestValue.timeout);
});
