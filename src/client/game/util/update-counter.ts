export class UpdateCounter {
  private updateTimes: number[] = [];
  private lastUpdateTime = performance.now();

  constructor(private readonly sampleSize = 200) {}

  public tick() {
    const now = performance.now();
    const delta = now - this.lastUpdateTime;
    this.lastUpdateTime = now;

    if (delta > 1000) return;

    this.updateTimes.push(delta);

    while (this.updateTimes.length > this.sampleSize) {
      this.updateTimes.shift();
    }
  }

  get ups() {
    if (this.updateTimes.length < 2) return 0;
    const avgUpdateTime =
      this.updateTimes.reduce((a, b) => a + b, 0) / this.updateTimes.length;
    return 1000 / avgUpdateTime;
  }
}
