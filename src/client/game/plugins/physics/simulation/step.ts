import { defaultParams } from '@common/simulation/physics';
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
import { evolveMotion, evolveOrientation } from '../evolution/evolve';
import { PhysicsState, type Physics } from '../physics.component';
import { addCollision, combine, createResult, type Result } from './result';

export type SimulationData = {
  balls: Physics[];
  pairs: [Physics, Physics][];
  ballCushions: [Physics, Cushion][];
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

const MAX_SUBSTEPS = 10;

const isActive = (ball: Physics) =>
  // todo: check ball out of bounds
  ball.state !== PhysicsState.Pocketed && ball.state !== PhysicsState.OutOfPlay;

/**
 * Precompute ball/cushion/pocket pairs required for simulation
 */
export const generateSimulationData = (
  balls: Physics[],
  cushions: Cushion[],
  pockets: Pocket[],
  { cueBallOnly }: { cueBallOnly?: boolean } = {}
): SimulationData => {
  const activeBalls = balls.filter(isActive);
  const activeTargetBalls = cueBallOnly ? balls.slice(1).filter(isActive) : [];

  return {
    balls: cueBallOnly ? [balls[0]] : balls,
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
  data: SimulationData,
  {
    trackPath,
    stepIndex = -1,
    profiler = Profiler.none,
    result = createResult(),
    ignoreBallCollisions,
  }: SimulationStepParameters
): Result => {
  const doTrackPath =
    trackPath && stepIndex % defaultParams.simulation.trackingPointDist === 0;

  const endBallUpdate = profiler.start('ball-update');
  for (const ball of data.balls) {
    evolveMotion(ball, dt);
    evolveOrientation(ball, dt);
    if (doTrackPath) {
      // result.addTrackingPoint(ball);
    }
  }
  endBallUpdate();

  if (!ignoreBallCollisions) {
    const endBallBall = profiler.start('ball-ball');
    // ball <-> ball collisions
    for (const [ball1, ball2] of data.pairs) {
      const collision = collideBallBall(ball1, ball2);
      if (collision) addCollision(result, collision);
    }
    endBallBall();
  }

  const endBallCushion = profiler.start('ball-cushion');
  // ball -> cushion collisions
  for (const [ball, cushion] of data.ballCushions) {
    const collision = collideBallCushion(ball, cushion);
    if (collision) addCollision(result, collision);
  }
  endBallCushion();

  const endBallPocket = profiler.start('ball-pocket');
  for (const [ball, pocket] of data.ballPockets) {
    const collision = collideBallPocket(ball, pocket);
    if (collision) addCollision(result, collision);
  }
  endBallPocket();

  return result;
};

export const simulationStep = (
  dt: number,
  data: SimulationData,
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
      return combine(result, simulationSubstep(dt, data, parameters));
    }

    result = combine(
      result,
      simulationSubstep(nextCollision, data, parameters)
    );
    dt -= nextCollision;
  }

  return result;
};
