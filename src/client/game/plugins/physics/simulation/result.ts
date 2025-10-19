import { Ruleset } from '@common/simulation/physics';
import type { GameRules } from '../../../resources/game-rules/types';
import type { Collision } from '../collision/types';
import { Physics, type PhysicsSnapshot } from '../physics.component';

export type Result = {
  readonly steps: number;
  readonly substeps: number;
  readonly ballsPotted: readonly number[];
  /** balls sent off table during shot */
  readonly ballsEjected: readonly number[];
  readonly collisions: readonly Collision[];
  readonly cueBallCollisions: number;
  readonly ballCollisions: number;
  readonly cueBallCushionCollisions: number;
  readonly cushionCollisions: number;
  // todo: readonly array
  readonly trackingPoints: Map<number, PhysicsSnapshot[]>;

  // derived from collisions
  readonly firstStruck?: number;
  readonly scratched: boolean;

  nextExpectedCollision?: number;
};

type Writable<T> = {
  -readonly [K in keyof T]: T[K] extends ReadonlyArray<infer U> ? U[] : T[K];
};

export const createResult = (): Result => ({
  steps: 0,
  substeps: 0,
  ballsPotted: [],
  ballsEjected: [],
  collisions: [],
  cueBallCollisions: 0,
  ballCollisions: 0,
  cueBallCushionCollisions: 0,
  cushionCollisions: 0,
  trackingPoints: new Map(),
  firstStruck: undefined,
  scratched: false,
});

export const addCollision = (result: Result, collision: Collision) => {
  const write = result as Writable<Result>;

  if (collision.type === 'ball-ball') {
    if (collision.initiator.id === 0) {
      write.cueBallCollisions++;

      if (result.firstStruck === undefined) {
        write.firstStruck = collision.other.id;
      }
    } else {
      write.ballCollisions++;
    }
  }

  if (collision.type === 'ball-cushion') {
    if (collision.initiator.id === 0) {
      write.cueBallCushionCollisions++;
    } else {
      write.cushionCollisions++;
    }
  }

  if (collision.type === 'ball-pocket') {
    write.ballsPotted.push(collision.initiator.id);

    if (collision.initiator.id === 0) {
      write.scratched = true;
    }
  }

  collision.step = write.steps;
  write.collisions.push(collision);
};

export const addTrackingPoint = (result: Result, ball: Physics) => {
  if (!result.trackingPoints.has(ball.id)) {
    result.trackingPoints.set(ball.id, [
      Physics.snapshot(ball, { frame: result.steps }),
    ]);
  } else {
    result.trackingPoints
      .get(ball.id)!
      .push(Physics.snapshot(ball, { frame: result.steps }));
  }
};

export const addEjectedBall = (result: Result, ball: Physics) => {
  const write = result as Writable<Result>;
  write.ballsEjected.push(ball.id);
};

export const incrementStep = (result: Result) => {
  (result as Writable<Result>).steps++;
};

export const incrementSubstep = (result: Result) => {
  (result as Writable<Result>).substeps++;
};

const combineMaps = <T extends Map<any, any[]>>(map1: T, map2: T): T => {
  const combined = new Map(map1) as T;

  for (const [key, values] of map2.entries()) {
    if (combined.has(key)) {
      try {
        combined.set(key, combined.get(key)!.concat(values));
      } catch (e) {
        console.log(key);
        console.log(combined.get(key)?.length);
        console.log(values.length);
        throw new Error('Failed to merge maps', { cause: e });
      }
    } else {
      combined.set(key, values);
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
  substeps: first.substeps + second.substeps,
  ballsPotted: [...first.ballsPotted, ...second.ballsPotted],
  ballsEjected: [...first.ballsEjected, ...second.ballsEjected],
  collisions: [...first.collisions, ...second.collisions],
  cueBallCollisions: first.cueBallCollisions + second.cueBallCollisions,
  ballCollisions: first.ballCollisions + second.ballCollisions,
  cueBallCushionCollisions:
    first.cueBallCushionCollisions + second.cueBallCushionCollisions,
  cushionCollisions: first.cushionCollisions + second.cushionCollisions,
  trackingPoints: combineMaps(first.trackingPoints, second.trackingPoints),
  firstStruck: first.firstStruck ?? second.firstStruck,
  scratched: first.scratched || second.scratched,
});

export type TurnFoul = {
  fouled: true;
  foulReason:
    | 'scratched'
    | 'hit-nothing'
    | 'hit-invalid'
    | 'potted-invalid'
    | 'ball-ejected'
    | 'no-cushion-contact';
};

type TurnResult =
  | {
      fouled: false;
      success: boolean;
    }
  | TurnFoul;

export const getFoul = (result: Result, rules: GameRules): boolean => {
  return (
    result.ballsPotted.includes(0) ||
    result.ballsEjected.length > 0 ||
    result.firstStruck === undefined ||
    !rules.validTargets.includes(result.firstStruck) ||
    result.ballsPotted.some((ball) => rules.invalidPottable.includes(ball))
  );
};

/**
 * Check if there is an immediate foul in the shot.
 *
 * Used for guidelines.
 */
export const hasImmediateFoul = (result: Result, rules: GameRules): boolean => {
  return (
    result.ballsPotted.includes(0) ||
    result.ballsEjected.length > 0 ||
    (result.firstStruck !== undefined &&
      !rules.validTargets.includes(result.firstStruck))
  );
};

export const getTurnResult = (result: Result, rules: GameRules): TurnResult => {
  switch (true) {
    case result.ballsPotted.includes(0):
      return { fouled: true, foulReason: 'scratched' };
    case result.ballsEjected.length > 0:
      return { fouled: true, foulReason: 'ball-ejected' };
    case result.firstStruck === undefined:
      return { fouled: true, foulReason: 'hit-nothing' };
    case result.ballsPotted.some((ball) =>
      rules.invalidPottable.includes(ball)
    ):
      return { fouled: true, foulReason: 'potted-invalid' };
    case !rules.validTargets.includes(result.firstStruck!):
      return { fouled: true, foulReason: 'hit-invalid' };
    default: {
      return {
        fouled: false,
        success: rules.validPottable.some((ball) =>
          result.ballsPotted.includes(ball)
        ),
      };
    }
  }
};

export const isGameOver = (result: Result, rules: GameRules) => {
  switch (rules.ruleset) {
    case Ruleset._8Ball:
      return result.ballsPotted.includes(8) || result.ballsEjected.includes(8);
    case Ruleset._9Ball:
      return result.ballsPotted.includes(9) || result.ballsEjected.includes(9);
    default:
      return rules.validTargets.every(
        (ball) =>
          result.ballsPotted.includes(ball) ||
          result.ballsEjected.includes(ball)
      );
  }
};
