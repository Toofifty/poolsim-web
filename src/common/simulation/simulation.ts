import { vec, type Vec } from '../math';
import { Profiler, type IProfiler } from '../util/profiler';
import type { Params } from './physics';
import { Result, StepResult } from './result';
import type { Shot } from './shot';
import type { TableState } from './table-state';

export type RunSimulationOptions = {
  state: TableState;
  shot: Shot;
  trackPath: boolean;
  profiler?: IProfiler;
  stopAtFirstContact?: boolean;
  stopAtFirstBallContact?: boolean;
  cueBallRollDist?: number;
};

export type RunSimulationStepOptions = {
  simulated: boolean;
  trackPath: boolean;
  dt: number;
  state: TableState;
  stepIndex?: number;
  profiler?: IProfiler;
  stopAtFirstContact?: boolean;
  stopAtFirstBallContact?: boolean;
  /** Write to this result instead of creating a new one */
  result?: Result;
  cueBallOnly?: boolean;
  ignoreBallCollisions?: boolean;
};

export interface ISimulation {
  run(args: RunSimulationOptions): Promise<Result>;
  runBatch(
    args: Omit<RunSimulationOptions, 'state'>[],
    state: TableState
  ): Promise<Result[]>;
}

export class Simulation implements ISimulation {
  constructor(private params: Params) {}

  public step(options: RunSimulationStepOptions): StepResult {
    const {
      simulated,
      trackPath,
      state,
      stepIndex = -1,
      profiler = Profiler.none,
      result = new StepResult(),
      cueBallOnly,
      ignoreBallCollisions,
    } = options;

    let dt = options.dt;

    const balls = cueBallOnly ? [state.cueBall] : state.balls;
    const activePairs = cueBallOnly ? state.cueBallPairs : state.activePairs;
    const activeBallCushions = cueBallOnly
      ? state.cueBallCushions
      : state.activeBallCushions;
    const activeBallPockets = cueBallOnly
      ? state.cueBallPockets
      : state.activeBallPockets;

    let nextCollision = dt;

    if (!ignoreBallCollisions) {
      // substep ball-ball collisions
      for (let [ball, other] of activePairs) {
        const ct = ball.computeCollisionTime(other, dt);
        if (ct > 1e-6 && ct < nextCollision) {
          nextCollision = ct;
        }
      }
    }

    // substep ball-cushion collisions
    for (let [ball, cushion] of activeBallCushions) {
      const ct = ball.computeCushionCollisionTime(cushion, dt);
      if (ct > 1e-6 && ct < nextCollision) {
        nextCollision = ct;
      }
    }

    if (nextCollision < dt) {
      dt = nextCollision;
    }

    const doTrackPath =
      trackPath && stepIndex % this.params.simulation.trackingPointDist === 0;

    const endBallUpdate = profiler.start('ballUpdate');
    for (let ball of balls) {
      ball.evolve(dt, simulated);
      if (doTrackPath) {
        result.addTrackingPoint(ball);
      }
    }
    endBallUpdate();

    if (!ignoreBallCollisions) {
      const endBallBall = profiler.start('ballBall');
      // ball <-> ball collisions
      for (let [ball, other] of activePairs) {
        const collision = ball.collideBall(other);
        if (collision) {
          if (collision.initiator.id === 0) {
            if (result.firstStruck === undefined) {
              result.setFirstStruck(collision.other.id);
            }
            result.cueBallCollisions++;
          } else {
            result.ballBallCollisions++;
          }
          result.addCollision(collision);
        }
      }
      endBallBall();
    }

    const endBallCushion = profiler.start('ballCushion');
    // ball -> cushion collisions
    for (let [ball, cushion] of activeBallCushions) {
      const collision = ball.collideCushion(cushion);
      if (collision) {
        if (collision.initiator.id === 0) {
          result.cueBallCushionCollisions++;
        } else {
          result.ballCushionCollisions++;
        }
        result.addCollision(collision);
      }
    }
    endBallCushion();

    const endBallPocket = profiler.start('ballPocket');
    // ball -> pocket collisions
    for (let [ball, pocket] of activeBallPockets) {
      const collision = ball.collidePocket(pocket);
      if (collision) {
        if (collision.initiator.id === 0) {
          result.scratched = true;
        } else {
          result.ballsPotted.push(ball.id);
        }
        result.addCollision(collision);
        state.needsUpdate = true;
      }
    }
    endBallPocket();

    return result;
  }

  public async run({
    shot,
    state,
    trackPath,
    profiler = Profiler.none,
    stopAtFirstContact = false,
    stopAtFirstBallContact = false,
    cueBallRollDist,
  }: RunSimulationOptions) {
    const copiedState = state.clone();

    copiedState.cueBall.hit(shot);

    const end = profiler.start('run');
    const result = new Result(shot, copiedState);

    const isInvalidBreak =
      copiedState.isBreak &&
      !copiedState.isSandbox &&
      (shot.angle < -Math.PI / 2 || shot.angle > Math.PI / 2);

    let firstContactPosition: Vec | undefined = undefined;

    for (let i = 0; i < this.params.simulation.maxIterations; i++) {
      profiler.profile('step', () =>
        this.step({
          simulated: true,
          trackPath,
          dt: 1 / this.params.simulation.updatesPerSecond,
          state: copiedState,
          stepIndex: i,
          result,
          profiler,
          cueBallOnly:
            result.firstStruck === undefined || cueBallRollDist !== undefined,
          ignoreBallCollisions:
            cueBallRollDist !== undefined && firstContactPosition !== undefined,
        })
      );

      if (result.hitFoulBall || result.hasOutOfBoundsBall()) {
        break;
      }

      if (isInvalidBreak && result.cueBallCushionCollisions > 0) {
        result.invalidShot = true;
        break;
      }

      if (
        cueBallRollDist !== undefined &&
        result.cueBallCollisions > 0 &&
        (firstContactPosition === undefined ||
          vec.dist(copiedState.cueBall.r, firstContactPosition) <
            cueBallRollDist)
      ) {
        if (firstContactPosition === undefined) {
          firstContactPosition = vec.clone(copiedState.cueBall.r);
        }
        continue;
      }

      if (stopAtFirstBallContact && result.cueBallCollisions > 0) {
        break;
      }

      if (
        stopAtFirstContact &&
        (result.cueBallCollisions > 0 || result.cueBallCushionCollisions > 0)
      ) {
        break;
      }

      if (copiedState.settled) {
        break;
      }
    }

    // add final tracking points
    copiedState.balls.forEach((ball) => {
      result.addTrackingPoint(ball);
    });

    end();
    return result;
  }

  public async runBatch(
    batchParams: Omit<RunSimulationOptions, 'state'>[],
    state: TableState
  ) {
    return Promise.all(batchParams.map((args) => this.run({ state, ...args })));
  }
}
