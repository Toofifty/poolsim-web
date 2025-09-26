import { settings } from './store/settings';

const sum = (n: number[]) => n.reduce((s, c) => s + c, 0);
const avg = (n: number[]) => sum(n) / n.length;

export interface IProfiler {
  dump(): void;
  profile<T = void>(key: string, fn: () => T): T;
  start(key: string): () => void;
}

export class Profiler implements IProfiler {
  private profiles: Record<string, number[]> = {};
  private activeProfiles: Record<string, number> = {};

  private activeProfileStack: string[] = [];

  public static none: IProfiler = {
    dump: () => {},
    profile: <T = void>(_: string, fn: () => T) => fn(),
    start: (_) => () => {},
  };

  public dump() {
    if (!settings.enableProfiler) {
      return;
    }

    const profiles = Object.fromEntries(
      Object.entries(this.profiles).map(([key, timings]) => {
        const path = key.split('.');
        const hasParent = path.length > 1;
        const parentKey = hasParent ? path.slice(0, -1).join('.') : '';
        const parentTimings = hasParent ? this.profiles[parentKey] : [];
        return [
          key,
          {
            calls: timings.length,
            average: +avg(timings).toFixed(4),
            // 'average %': hasParent
            //   ? +((100 * avg(timings)) / avg(parentTimings)).toFixed(precision)
            //   : 0,
            total: +sum(timings).toFixed(4),
            'total %': hasParent
              ? +((100 * sum(timings)) / sum(parentTimings)).toFixed(2)
              : 0,
          },
        ];
      })
    );
    console.table(profiles);
    this.profiles = {};
  }

  public profile<T = void>(key: string, fn: () => T): T {
    const end = this.start(key);
    const result = fn();
    end();
    return result;
  }

  public start(key: string) {
    if (!settings.enableProfiler) {
      return () => {};
    }

    const fullkey = [...this.activeProfileStack, key].join('.');
    const start = performance.now();
    this.activeProfiles[fullkey] = start;
    this.activeProfileStack.push(key);

    return () => {
      const end = performance.now();
      const dur = end - start;
      if (!this.profiles[fullkey]) {
        this.profiles[fullkey] = [];
      }
      this.profiles[fullkey].push(dur);
      delete this.activeProfiles[fullkey];
      this.activeProfileStack.pop();
    };
  }
}
