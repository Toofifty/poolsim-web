import { properties } from '../physics/properties';
import { Result, StepResult } from '../physics/result';
import type { Shot } from '../physics/shot';
import { Profiler, type IProfiler } from '../profiler';
import type { TableState } from './table-state';

export type RunSimulationOptions = {
  state: TableState;
  shot: Shot;
  profiler?: IProfiler;
  stopAtFirstContact?: boolean;
};

export type RunSimulationStepOptions = {
  simulated: boolean;
  dt: number;
  state: TableState;
  stepIndex?: number;
  profiler?: IProfiler;
};

export interface ISimulation {
  // step(params: RunSimulationStepOptions): StepResult;
  run(params: RunSimulationOptions): Promise<Result>;
}

export class Simulation implements ISimulation {
  public step({
    simulated,
    dt,
    state,
    stepIndex = -1,
    profiler = Profiler.none,
  }: RunSimulationStepOptions) {
    const result = new StepResult();
    const trackPath = stepIndex % properties.trackingPointDist === 0;

    const endBallUpdate = profiler.start('ballUpdate');
    state.balls.forEach((ball) => {
      ball.evolve(dt, simulated);
      if (trackPath) {
        result.addTrackingPoint(ball);
      }
    });
    endBallUpdate();

    const activeBalls = state.activeBalls;

    const endBallBall = profiler.start('ballBall');
    // ball <-> ball collisions
    for (let i = 0; i < activeBalls.length; i++) {
      const ball = activeBalls[i];

      for (let j = i + 1; j < activeBalls.length; j++) {
        const other = activeBalls[j];
        // dont fix overlap with evolution physics enabled
        const collision = ball.collideBall(other);
        if (collision) {
          if (collision.initiator.id === -1) {
            if (result.firstStruck === -1) {
              result.firstStruck = collision.other.id;
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
          if (collision.initiator.id === -1) {
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
          if (collision.initiator.id === -1) {
            result.pottedCueBall = true;
          } else {
            result.ballsPotted++;
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
    profiler = Profiler.none,
    stopAtFirstContact = false,
  }: RunSimulationOptions) {
    const copiedState = state.clone();

    copiedState.cueBall.hit(shot);

    const end = profiler.start('run');
    const result = new Result(shot, copiedState);

    const isInvalidBreak =
      copiedState.isBreak &&
      (shot.angle < -Math.PI / 2 || shot.angle > Math.PI / 2);

    for (let i = 0; i < properties.maxIterations; i++) {
      const stepResult = profiler.profile('step', () =>
        this.step({
          simulated: true,
          dt: 1 / properties.updatesPerSecond,
          state: copiedState,
          stepIndex: i,
        })
      );
      profiler.profile('add-result', () => {
        result.add(stepResult);
      });

      if (result.hitFoulBall) {
        break;
      }

      if (isInvalidBreak && result.cueBallCushionCollisions > 0) {
        result.invalidShot = true;
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

    end();
    return result;
  }
}
