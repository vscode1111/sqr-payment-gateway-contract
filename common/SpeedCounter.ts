export class SpeedCounter {
  private counter: number;
  private t: number;
  private counterDiff: number;
  private timeDiff: number;
  private speed: number;

  constructor() {
    this.counter = 0;
    this.t = new Date().getTime();
    this.counterDiff = 0;
    this.timeDiff = 0;
    this.speed = 0;
  }

  public store(value: number) {
    this.counterDiff = value - this.counter;
    this.counter = value;

    const now = new Date().getTime();

    this.timeDiff = now - this.t;
    this.t = now;

    this.speed = (this.counterDiff / this.timeDiff) * 1000;
  }

  public stats() {
    return {
      counterDiff: this.counterDiff,
      timeDiff: this.timeDiff,
      speed: this.speed,
    };
  }
}
