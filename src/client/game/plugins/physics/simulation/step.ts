import { defaultParams } from '@common/simulation/physics';
import { assert } from '@common/util';
import { iteration, pairs } from '@common/util/iterate';
import { Profiler, type IProfiler } from '@common/util/profiler';
import type { Cushion } from '../../table/cushion.component';
import type { Pocket } from '../../table/pocket.component';
import {
  collideBallBall,
  collideBallCushion,
  collideBallPocket,
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
import { PhysicsState, type Physics } from '../physics.component';
import {
  addCollision,
  addTrackingPoint,
  createResult,
  type Result,
} from './result';

// todo: include break status
export type SimulationState = {
  /** All balls */
  balls: Physics[];
  /** All pockets */
  pockets: Pocket[];
  /** Pairs of active balls */
  pairs: [Physics, Physics][];
  /** Pairs of active balls -> cushions */
  ballCushions: [Physics, Cushion][];
  /** Pairs of active balls -> pockets */
  ballPockets: [Physics, Pocket][];
};

export type SimulationStepParameters = {
  trackPath: boolean;
  stepIndex?: number;

  profiler?: IProfiler;
  stopAtFirstContact?: boolean;
  stopAtFirstBallContact?: boolean;

  ignoreBallCollisions?: boolean;
  cueBallOnly?: boolean;

  result?: Result;
};

const MAX_SUBSTEPS = 2;

const isActive = (ball: Physics) =>
  // todo: check ball out of bounds
  ball.state !== PhysicsState.Pocketed && ball.state !== PhysicsState.OutOfPlay;

/**
 * Precompute ball/cushion/pocket pairs required for simulation
 */
export const createSimulationState = (
  balls: Physics[],
  cushions: Cushion[],
  pockets: Pocket[],
  { cueBallOnly }: { cueBallOnly?: boolean } = {}
): SimulationState => {
  const activeBalls = balls.filter(isActive);
  const activeTargetBalls = cueBallOnly ? balls.slice(1).filter(isActive) : [];

  return {
    balls: cueBallOnly ? [balls[0]] : balls,
    pockets,
    pairs: cueBallOnly
      ? iteration([balls[0]], activeTargetBalls)
      : pairs(activeBalls),
    ballCushions: cueBallOnly
      ? iteration([balls[0]], cushions)
      : iteration(activeBalls, cushions),
    ballPockets: cueBallOnly
      ? iteration([balls[0]], pockets)
      : iteration(activeBalls, pockets),
  };
};

const simulationSubstep = (
  dt: number,
  state: SimulationState,
  result: Result,
  {
    trackPath,
    stepIndex = -1,
    profiler = Profiler.none,
    ignoreBallCollisions,
  }: Omit<SimulationStepParameters, 'result'>
): Result => {
  const doTrackPath =
    trackPath && stepIndex % defaultParams.simulation.trackingPointDist === 0;

  const endBallUpdate = profiler.start('ball-update');
  for (const ball of state.balls) {
    if (ball.state === PhysicsState.Pocketed) {
      assert(ball.pocketId, 'Missing pocket id for pocketed ball');
      assert(
        state.pockets[ball.pocketId],
        `Could not find pocket ${ball.pocketId}`
      );

      evolvePocket(ball, state.pockets[ball.pocketId], dt);
    } else {
      evolveMotion(ball, dt);
    }
    evolveOrientation(ball, dt);
    if (doTrackPath) {
      addTrackingPoint(result, ball);
    }
  }
  endBallUpdate();

  if (!ignoreBallCollisions) {
    const endBallBall = profiler.start('ball-ball');
    // ball <-> ball collisions
    for (const [ball1, ball2] of state.pairs) {
      const collision = collideBallBall(ball1, ball2);
      if (collision) addCollision(result, collision);
    }
    endBallBall();
  }

  const endBallCushion = profiler.start('ball-cushion');
  // ball -> cushion collisions
  for (const [ball, cushion] of state.ballCushions) {
    const collision = collideBallCushion(ball, cushion);
    if (collision) addCollision(result, collision);
  }
  endBallCushion();

  const endBallPocket = profiler.start('ball-pocket');
  for (const [ball, pocket] of state.ballPockets) {
    const collision = collideBallPocket(ball, pocket);
    if (collision) addCollision(result, collision);
  }
  endBallPocket();

  return result;
};

export const simulationStep = (
  dt: number,
  data: SimulationState,
  parameters: SimulationStepParameters
): Result => {
  const { ignoreBallCollisions } = parameters;
  let result = parameters.result ?? createResult();

  let substeps = 0;
  while (dt > 0 && substeps++ < MAX_SUBSTEPS) {
    let nextCollision = dt;

    if (!ignoreBallCollisions) {
      // substep ball-ball collisions
      for (let [ball1, ball2] of data.pairs) {
        const ct = computeBallCollisionTime(ball1, ball2, dt);
        if (ct > 1e-6 && ct < nextCollision) {
          nextCollision = ct;
        }
      }
    }

    // substep ball-cushion collisions
    for (let [ball, cushion] of data.ballCushions) {
      const ct = computeCushionCollisionTime(ball, cushion, dt);
      if (ct > 1e-6 && ct < nextCollision) {
        nextCollision = ct;
      }
    }

    if (nextCollision >= dt) {
      return simulationSubstep(dt, data, result, parameters);
    }

    simulationSubstep(nextCollision, data, result, parameters);
    dt -= nextCollision;
  }

  return result;
};
