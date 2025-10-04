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
  isSubstep?: boolean;
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
      isSubstep,
    } = options;

    let dt = options.dt;

    const activeBalls = state.activeBalls;

    if (!isSubstep) {
      // break down collisions
      // todo: substep cushions
      let nextCollision = Infinity;
      for (let i = 0; i < activeBalls.length; i++) {
        const ball = activeBalls[i];
        for (let j = i + 1; j < activeBalls.length; j++) {
          const other = activeBalls[j];
          const ct = ball.computeCollisionTime(other, dt);
          if (ct > 1e-6 && ct < nextCollision) {
            nextCollision = ct;
          }
        }
      }

      if (nextCollision < dt) {
        // run until collision
        const substepResult = this.step({
          ...options,
          dt: nextCollision,
          isSubstep: true,
        });
        if (stopAtFirstContact || stopAtFirstBallContact) {
          return substepResult;
        }

        result.add(substepResult);
        // process rest of time step
        dt -= nextCollision;
      }
    }

    const doTrackPath =
      trackPath && stepIndex % this.params.simulation.trackingPointDist === 0;

    const endBallUpdate = profiler.start('ballUpdate');
    state.balls.forEach((ball) => {
      ball.evolve(dt, simulated);
      if (doTrackPath) {
        result.addTrackingPoint(ball);
      }
    });
    endBallUpdate();

    const endBallBall = profiler.start('ballBall');
    // ball <-> ball collisions
    for (let i = 0; i < activeBalls.length; i++) {
      const ball = activeBalls[i];

      for (let j = i + 1; j < activeBalls.length; j++) {
        const other = activeBalls[j];
        // dont fix overlap with evolution physics enabled
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
          result.collisions.push(collision);
        }
      }
    }
    endBallBall();

    const endBallCushion = profiler.start('ballCushion');
    // ball -> cushion collisions
    for (let i = 0; i < activeBalls.length; i++) {
      const ball = activeBalls[i];
      for (let j = 0; j < state.cushions.length; j++) {
        const cushion = state.cushions[j];
        const collision = ball.collideCushion(cushion);
        if (collision) {
          if (collision.initiator.id === 0) {
            result.cueBallCushionCollisions++;
          } else {
            result.ballCushionCollisions++;
          }
          result.collisions.push(collision);
        }
      }
    }
    endBallCushion();

    const endBallPocket = profiler.start('ballPocket');
    // ball -> pocket collisions
    for (let i = 0; i < activeBalls.length; i++) {
      const ball = activeBalls[i];
      for (let j = 0; j < state.pockets.length; j++) {
        const pocket = state.pockets[j];
        const collision = ball.collidePocket(pocket);
        if (collision) {
          if (collision.initiator.id === 0) {
            result.pottedCueBall = true;
          } else {
            result.ballsPotted.push(ball.id);
          }
          result.collisions.push(collision);
        }
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
