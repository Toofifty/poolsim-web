import type { Collision } from '../collision/types';
import type { PhysicsSnapshot } from '../physics.component';

export type Result = {
  readonly steps: number;
  readonly ballsPotted: readonly number[];
  readonly collisions: readonly Collision[];
  // todo: readonly array
  readonly trackingPoints: Map<number, PhysicsSnapshot[]>;

  // derived from collisions
  readonly firstStruck?: number;
  readonly scratched: boolean;
};

type Writable<T> = {
  -readonly [K in keyof T]: T[K] extends ReadonlyArray<infer U> ? U[] : T[K];
};

export const createResult = (): Result => ({
  steps: 1,
  ballsPotted: [],
  collisions: [],
  trackingPoints: new Map(),
  firstStruck: undefined,
  scratched: false,
});

export const addCollision = (result: Result, collision: Collision) => {
  const write = result as Writable<Result>;

  if (collision.type === 'ball-ball') {
    if (collision.initiator.id === 0 && result.firstStruck === undefined) {
      write.firstStruck = collision.other.id;
    }
  }

  if (collision.type === 'ball-pocket') {
    write.ballsPotted.push(collision.initiator.id);

    if (collision.initiator.id === 0) {
      write.scratched = true;
    }
  }

  write.collisions.push(collision);
};

const combineMaps = <T extends Map<any, any[]>>(map1: T, map2: T): T => {
  const combined = new Map(map1) as T;

  for (const [key, values] of map2) {
    if (!combined.has(key)) {
      combined.set(key, values);
    } else {
      combined.get(key)!.push(...values);
    }
  }

  return combined;
};

/**
 * Combine two results. `first` has precedence for any
 * accumulated values (like `firstStruck`)
 */
export const combine = (first: Result, second: Result): Result => ({
  steps: first.steps + second.steps,
  ballsPotted: [...first.ballsPotted, ...second.ballsPotted],
  collisions: [...first.collisions, ...second.collisions],
  trackingPoints: combineMaps(first.trackingPoints, second.trackingPoints),
  firstStruck: first.firstStruck ?? second.firstStruck,
  scratched: first.scratched || second.scratched,
});
