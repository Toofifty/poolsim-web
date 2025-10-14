import { type Params } from '@common/simulation/physics';
import { assert, assertExists } from '@common/util';
import { Profiler, type IProfiler } from '@common/util/profiler';
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
import { Physics, PhysicsState } from '../physics.component';
import {
  addCollision,
  addEjectedBall,
  addTrackingPoint,
  createResult,
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

const MAX_SUBSTEPS = 2;

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

  const endBallUpdate = profiler.start('ball-update');
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
  endBallUpdate();

  if (!ignoreBallCollisions) {
    const endBallBall = profiler.start('ball-ball');
    // ball <-> ball collisions
    for (const [ball1, ball2] of state.pairs) {
      const collision = collideBallBall(params, ball1, ball2);
      if (collision) addCollision(result, collision);
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

export const simulationStep = (
  dt: number,
  data: SimulationState,
  parameters: SimulationStepParameters
): Result => {
  const { ignoreBallCollisions, params } = parameters;
  let result = parameters.result ?? createResult();

  let substeps = 0;
  while (dt > 0 && substeps++ < MAX_SUBSTEPS) {
    let nextCollision = dt;

    if (!ignoreBallCollisions) {
      // substep ball-ball collisions
      for (let [ball1, ball2] of data.pairs) {
        const ct = computeBallCollisionTime(params, ball1, ball2, dt);
        if (ct > 1e-6 && ct < nextCollision) {
          nextCollision = ct;
        }
      }
    }

    // substep ball-cushion collisions
    for (let [ball, cushion] of data.ballCushions) {
      const ct = computeCushionCollisionTime(params, ball, cushion, dt);
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
