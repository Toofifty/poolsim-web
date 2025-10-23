import { type Params } from '@common/simulation/physics';
import { assert, assertExists } from '@common/util';
import { Profiler, type IProfiler } from '@common/util/profiler';
import {
  collideBallCushion,
  collideBallPocket,
  getBallBallCollision,
  solveBallBallCollisions,
} from '../collision/collide';
import {
  computeBallCollisionTime,
  computeCushionCollisionTime,
} from '../collision/compute';
import {
  evolveMotion,
  evolveOrientation,
  evolvePocket,
} from '../evolution/evolve';
import { Physics, PhysicsState } from '../physics.component';
import {
  addCollision,
  addEjectedBall,
  addTrackingPoint,
  createResult,
  incrementStep,
  incrementSubstep,
  type Result,
} from './result';
import type { SimulationState } from './state';

export type SimulationStepParameters = {
  params: Params;
  trackPath: boolean;
  stepIndex?: number;

  profiler?: IProfiler;
  stopAtFirstContact?: boolean;
  stopAtFirstBallContact?: boolean;

  ignoreBallCollisions?: boolean;
  cueBallOnly?: boolean;

  result?: Result;
};

const MAX_SUBSTEPS = 20;

const simulationSubstep = (
  dt: number,
  state: SimulationState,
  result: Result,
  {
    params,
    trackPath,
    stepIndex = -1,
    profiler = Profiler.none,
    ignoreBallCollisions,
  }: Omit<SimulationStepParameters, 'result'>
): Result => {
  const doTrackPath =
    trackPath && stepIndex % params.simulation.trackingPointDist === 0;
  incrementSubstep(result);

  const endBallMotion = profiler.start('motion');
  for (const ball of state.balls) {
    if (outOfBounds(params, ball) && ball.state !== PhysicsState.OutOfPlay) {
      ball.state = PhysicsState.OutOfPlay;
      addEjectedBall(result, ball);
    }

    if (ball.state === PhysicsState.Pocketed) {
      assertExists(ball.pocketId, 'Missing pocket id for pocketed ball');
      assert(
        state.pockets[ball.pocketId],
        `Could not find pocket ${ball.pocketId}`
      );

      evolvePocket(params, ball, state.pockets[ball.pocketId], dt);
    } else {
      evolveMotion(params, ball, dt);
    }

    evolveOrientation(params, ball, dt);
    if (doTrackPath) {
      addTrackingPoint(result, ball);
    }
  }
  endBallMotion();

  if (!ignoreBallCollisions) {
    const endBallBall = profiler.start('ball-ball');
    // ball <-> ball collisions

    // precompute all collisions
    const collisions = state.pairs
      .map(([ball1, ball2]) => getBallBallCollision(ball1, ball2))
      .filter((v) => v !== undefined);

    if (collisions.length >= 1) {
      solveBallBallCollisions(collisions, params).forEach((c) =>
        addCollision(result, c)
      );
    }
    endBallBall();
  }

  const endBallCushion = profiler.start('ball-cushion');
  // ball -> cushion collisions
  for (const [ball, cushion] of state.ballCushions) {
    const collision = collideBallCushion(params, ball, cushion);
    if (collision) addCollision(result, collision);
  }
  endBallCushion();

  const endBallPocket = profiler.start('ball-pocket');
  for (const [ball, pocket] of state.ballPockets) {
    const collision = collideBallPocket(params, ball, pocket);
    if (collision) addCollision(result, collision);
  }
  endBallPocket();

  return result;
};

const computeNextCollision = (
  dt: number,
  data: SimulationState,
  {
    params,
    ignoreBallCollisions,
    profiler = Profiler.none,
  }: SimulationStepParameters
) => {
  let nextCollision = Infinity;

  const endCompute = profiler.start('compute');

  if (!ignoreBallCollisions) {
    // substep ball-ball collisions
    const endBallBall = profiler.start('ball-ball');
    for (let [ball1, ball2] of data.pairs) {
      const ct = profiler.profile('iter', () =>
        computeBallCollisionTime(params, ball1, ball2, dt)
      );
      if (ct > 1e-6 && ct < nextCollision) {
        nextCollision = ct;
      }
    }
    endBallBall();
  }

  // substep ball-cushion collisions
  const endBallCushion = profiler.start('ball-cushion');
  for (let [ball, cushion] of data.ballCushions) {
    const ct = profiler.profile('iter', () =>
      computeCushionCollisionTime(params, ball, cushion, dt)
    );
    if (ct > 1e-6 && ct < nextCollision) {
      nextCollision = ct;
    }
  }
  endBallCushion();
  endCompute();

  return nextCollision;
};

export const simulationStep = (
  dt: number,
  data: SimulationState,
  parameters: SimulationStepParameters
): Result => {
  let result = parameters.result ?? createResult();
  incrementStep(result);

  let substeps = 0;
  while (dt > 0 && substeps++ < MAX_SUBSTEPS) {
    // todo: optimize by reducing the amount of times we
    // compute the next collision. Ideally, it should only
    // need to be done once after each collision.

    // if ((result.nextExpectedCollision ?? 0) <= 0) {
    result.nextExpectedCollision = computeNextCollision(dt, data, parameters);
    // }

    if (result.nextExpectedCollision! >= dt) {
      result.nextExpectedCollision! -= dt;
      return simulationSubstep(dt, data, result, parameters);
    }

    simulationSubstep(result.nextExpectedCollision!, data, result, parameters);
    dt -= result.nextExpectedCollision!;
    result.nextExpectedCollision = undefined;
  }

  return result;
};

const outOfBounds = (params: Params, ball: Physics) => {
  if (ball.state === PhysicsState.Pocketed) return false;
  const {
    table: { length, width },
  } = params;
  return (
    ball.r[0] > length / 2 ||
    ball.r[0] < -length / 2 ||
    ball.r[1] > width / 2 ||
    ball.r[1] < -width / 2
  );
};
