import { parseError } from './misc';
import { Promisable, StringNumber } from './types';

export class Lock {
  private locked: boolean;
  private queue: Function[];

  constructor() {
    this.locked = false;
    this.queue = [];
  }

  acquire() {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve(0);
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release() {
    if (this.queue.length > 0) {
      const nextResolve = this.queue.shift();
      nextResolve?.();
    } else {
      this.locked = false;
    }
  }

  isEmpty() {
    return this.queue.length === 0 && !this.locked;
  }

  async tryInvoke<T>(fn: () => Promise<any>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } catch (e) {
      this.release();
      throw e;
    } finally {
      this.release();
    }
  }
}

export class IdLock {
  private locks: Map<StringNumber, Lock>;

  constructor() {
    this.locks = new Map();
  }

  acquire(id: StringNumber): Promise<() => void> {
    return new Promise((resolve) => {
      let lock = this.locks.get(id);

      if (!lock) {
        lock = new Lock();
        this.locks.set(id, lock);
      }

      lock.acquire().then(() => {
        resolve(() => {
          if (!lock) {
            return;
          }

          lock.release();
          if (lock.isEmpty()) {
            this.locks.delete(id);
          }
        });
      });
    });
  }

  async tryInvoke<T>(taskId: StringNumber, fn: () => Promisable<T>): Promise<T> {
    const release = await this.acquire(taskId);
    try {
      const result = await fn();
      return result;
    } catch (e) {
      release();
      parseError(e);
      throw e;
    } finally {
      release();
    }
  }
}
