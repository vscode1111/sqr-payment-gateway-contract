import { SnapshotRestorer, takeSnapshot } from '@nomicfoundation/hardhat-network-helpers';
import {
  FixtureAnonymousFunctionError,
  FixtureSnapshotError,
  InvalidSnapshotError,
} from './fixtureErrors';
import { isEqual } from './isEqual';

// from '@nomicfoundation/hardhat-network-helpers/src/errors';

type Fixture<T, P> = (fixtureParameters?: P) => Promise<T>;

interface Snapshot<T, P> {
  restorer: SnapshotRestorer;
  fixture: Fixture<T, P>;
  parameters: P;
  data: T;
}

let snapshots: Array<Snapshot<any, any>> = [];

/**
 * Useful in tests for setting up the desired state of the network.
 *
 * Executes the given function and takes a snapshot of the blockchain. Upon
 * subsequent calls to `loadFixture` with the same function, rather than
 * executing the function again, the blockchain will be restored to that
 * snapshot.
 *
 * _Warning_: don't use `loadFixture` with an anonymous function, otherwise the
 * function will be executed each time instead of using snapshots:
 *
 * - Correct usage: `loadFixture(deployTokens, deployTokensParameters)`
 * - Incorrect usage: `loadFixture(async (parameters) => { ... })`
 */
export async function loadFixture<T, P>(
  fixture: Fixture<T, P>,
  parameters?: P,
  onNewSnapshot?: (parameters?: P) => Promise<P>,
): Promise<T> {
  if (fixture.name === '') {
    throw new FixtureAnonymousFunctionError();
  }

  // const snapshot = snapshots.find((s) => s.fixture === fixture && s.parameters === parameters);
  const snapshot = snapshots.find(
    (s) => s.fixture === fixture && isEqual(s.parameters, parameters),
  );

  if (snapshot !== undefined) {
    try {
      await snapshot.restorer.restore();
      snapshots = snapshots.filter(
        (s) => Number(s.restorer.snapshotId) <= Number(snapshot.restorer.snapshotId),
      );
    } catch (e) {
      if (e instanceof InvalidSnapshotError) {
        throw new FixtureSnapshotError(e);
      }

      throw e;
    }

    return snapshot.data;
  } else {
    // const { takeSnapshot } = await import('./helpers/takeSnapshot');

    const newParameters = await onNewSnapshot?.(parameters);
    const data = await fixture(newParameters ?? parameters);
    const restorer = await takeSnapshot();

    snapshots.push({
      restorer,
      fixture,
      parameters,
      data,
    });

    return data;
  }
}
