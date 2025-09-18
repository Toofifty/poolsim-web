import type { Collision } from '../physics/collision';
import { properties } from '../physics/properties';
import type { Shot } from '../physics/shot';
import { Profiler, type IProfiler } from '../profiler';
import type { TableState } from './table-state';

export class Result {
  stepIterations = 1;
  ballsPotted = 0;
  pottedCueBall = false;
  hitFoulBall = false;
  firstStruck = -1;

  cueBallCollisions = 0;
  cueBallCushionCollisions = 0;

  ballBallCollisions = 0;
  ballCushionCollisions = 0;

  collisions: Collision[] = [];

  constructor(public shot?: Shot, public state?: TableState) {}

  public add(other: Result) {
    if (
      this.state &&
      this.state.is9Ball &&
      this.firstStruck === -1 &&
      other.firstStruck !== -1
    ) {
      // adding a strike - if it's not the lowest ball, it is a foul
      this.hitFoulBall = this.state.lowestActiveBallId !== other.firstStruck;
    }

    this.stepIterations += other.stepIterations;
    this.ballsPotted += other.ballsPotted;
    this.pottedCueBall ||= other.pottedCueBall;
    this.hitFoulBall ||= other.hitFoulBall;
    this.firstStruck =
      this.firstStruck === -1 ? other.firstStruck : this.firstStruck;
    this.cueBallCollisions += other.cueBallCollisions;
    this.cueBallCushionCollisions += other.cueBallCushionCollisions;
    this.ballBallCollisions += other.ballBallCollisions;
    this.ballCushionCollisions += other.ballCushionCollisions;
    this.collisions.push(...other.collisions);
    return this;
  }

  public hasFoul() {
    return (
      this.cueBallCollisions === 0 || this.pottedCueBall || this.hitFoulBall
    );
  }
}

export class StepResult extends Result {
  public hasBallCollision() {
    return this.cueBallCollisions > 0 || this.ballBallCollisions > 0;
  }

  public hasCushionCollision() {
    return this.cueBallCushionCollisions > 0 || this.ballCushionCollisions > 0;
  }
}

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
      ball.update(dt, simulated);
      if (trackPath) {
        // todo: add to Result
        // ball.addTrackingPoint();
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

    const endBallPocket = profiler.start('ballPocket');
    // ball -> pocket collisions
    for (let i = 0; i < activeBalls.length; i++) {
      const ball = activeBalls[i];
      for (let j = 0; j < state.pockets.length; j++) {
        const pocket = state.pockets[j];
        const collision = ball.collidePocket(pocket, simulated);
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

    return result;
  }

  public async run({
    shot,
    state,
    profiler = Profiler.none,
    stopAtFirstContact = false,
  }: RunSimulationOptions) {
    const copiedState = state.clone();
    const result = new Result(shot, copiedState);

    copiedState.cueBall.hit(shot);

    const end = profiler.start('run');

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

    console.log(result.collisions);

    end();
    return result;
  }
}
