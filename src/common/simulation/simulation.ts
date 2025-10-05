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
      stopAtFirstContact,
      stopAtFirstBallContact,
      result = new StepResult(),
    } = options;

    let dt = options.dt;
    let nextCollision = dt;

    // substep ball-ball collisions
    for (let [ball, other] of state.activePairs) {
      const ct = ball.computeCollisionTime(other, dt);
      if (ct > 1e-6 && ct < nextCollision) {
        nextCollision = ct;
      }
    }

    // substep ball-cushion collisions
    for (let [ball, cushion] of state.activeBallCushions) {
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
    for (let ball of state.balls) {
      ball.evolve(dt, simulated);
      if (doTrackPath) {
        result.addTrackingPoint(ball);
      }
    }
    endBallUpdate();

    const endBallBall = profiler.start('ballBall');
    // ball <-> ball collisions
    for (let [ball, other] of state.activePairs) {
      const collision = ball.collideBall(
        other,
        !stopAtFirstContact && !stopAtFirstBallContact
      );
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

    const endBallCushion = profiler.start('ballCushion');
    // ball -> cushion collisions
    for (let [ball, cushion] of state.activeBallCushions) {
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
    for (let [ball, pocket] of state.activeBallPockets) {
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
  }: RunSimulationOptions) {
    const copiedState = state.clone();

    copiedState.cueBall.hit(shot);

    const end = profiler.start('run');
    const result = new Result(shot, copiedState);

    const isInvalidBreak =
      copiedState.isBreak &&
      (shot.angle < -Math.PI / 2 || shot.angle > Math.PI / 2);

    for (let i = 0; i < this.params.simulation.maxIterations; i++) {
      profiler.profile('step', () =>
        this.step({
          simulated: true,
          trackPath,
          dt: 1 / this.params.simulation.updatesPerSecond,
          state: copiedState,
          stepIndex: i,
          stopAtFirstContact,
          stopAtFirstBallContact,
          result,
          profiler,
        })
      );

      if (result.hitFoulBall || result.hasOutOfBoundsBall()) {
        break;
      }

      if (isInvalidBreak && result.cueBallCushionCollisions > 0) {
        result.invalidShot = true;
        break;
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
