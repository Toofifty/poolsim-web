import { Game } from '../game';
import type { Table } from '../objects/table';
import type { Collision } from '../physics/collision';
import { properties } from '../physics/properties';
import type { Shot } from '../physics/shot';
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

  constructor(public state?: TableState) {}

  public add(other: Result) {
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

export class Simulation {
  private current!: Result;

  private lastSimulationKey = 0;

  constructor(private table: Table) {
    this.reset();
  }

  public reset() {
    this.current = new Result(this.table.state);
  }

  private getKey(shot: Shot) {
    return (
      shot.angle + shot.force * 10 + shot.sideSpin * 100 + shot.topSpin * 1000
    );
  }

  public getResult() {
    return this.current;
  }

  public step(
    state?: TableState,
    trackCollisionPoints?: boolean,
    stepIndex = -1
  ) {
    const simulated = !!state;
    state ??= this.table.state;

    const result = new StepResult();
    const trackPath = stepIndex % properties.trackingPointDist === 0;

    const endBallUpdate = Game.profiler.startProfile('ballUpdate');
    state.balls.forEach((ball) => {
      ball.update();
      if (trackCollisionPoints && trackPath) {
        ball.addTrackingPoint();
      }
    });
    endBallUpdate();

    const activeBalls = state.activeBalls;

    const endBallBall = Game.profiler.startProfile('ballBall');
    // ball <-> ball collisions
    for (let i = 0; i < activeBalls.length; i++) {
      const ball = activeBalls[i];
      for (let j = i + 1; j < activeBalls.length; j++) {
        const other = activeBalls[j];
        const collision = ball.collideBall(other);
        if (collision) {
          if (collision.initiator.owner.number === -1) {
            if (result.firstStruck === -1) {
              result.firstStruck = collision.other.owner.number;
            }
            result.cueBallCollisions++;
          } else {
            result.ballBallCollisions++;
          }

          if (trackCollisionPoints) {
            collision.initiator.owner.addCollisionPoint();
            collision.other.owner.addCollisionPoint();
          }
          result.collisions.push(collision);
        }
      }
    }
    endBallBall();

    const endBallPocket = Game.profiler.startProfile('ballPocket');
    // ball -> pocket collisions
    for (let i = 0; i < activeBalls.length; i++) {
      const ball = activeBalls[i];
      for (let j = 0; j < this.table.pockets.length; j++) {
        const pocket = this.table.pockets[j];
        const collision = ball.collidePocket(pocket, simulated);
        if (collision) {
          if (collision.initiator.owner.number === -1) {
            result.pottedCueBall = true;
          } else {
            result.ballsPotted++;
          }

          if (trackCollisionPoints) {
            collision.initiator.owner.addCollisionPoint();
          }
          result.collisions.push(collision);
        }
      }
    }
    endBallPocket();

    const endBallCushion = Game.profiler.startProfile('ballCushion');
    // ball -> cushion collisions
    for (let i = 0; i < activeBalls.length; i++) {
      const ball = activeBalls[i];
      for (let j = 0; j < this.table.cushions.length; j++) {
        const cushion = this.table.cushions[j];
        const collision = ball.collideCushion(cushion);
        if (collision) {
          if (collision.initiator.owner.number === -1) {
            result.cueBallCushionCollisions++;
          } else {
            result.ballCushionCollisions++;
          }

          if (trackCollisionPoints) {
            collision.initiator.owner.addCollisionPoint();
          }
          result.collisions.push(collision);
        }
      }
    }
    endBallCushion();

    if (!simulated) {
      this.current.add(result);
    }

    return result;
  }

  public run(shot: Shot, trackCollisionPoints?: boolean) {
    const copiedState = this.table.state.clone();
    const result = new Result(copiedState);

    copiedState.cueBall.hit(shot);

    const end = Game.profiler.startProfile('run');

    for (let i = 0; i < properties.maxIterations; i++) {
      const endStep = Game.profiler.startProfile('step');
      const stepResult = this.step(
        copiedState,
        trackCollisionPoints,
        trackCollisionPoints ? i : -1
      );
      const endAddResult = Game.profiler.startProfile('add');
      result.add(stepResult);
      endAddResult();
      endStep();

      if (copiedState.settled) {
        break;
      }
    }

    end();
    return result;
  }

  public clearAimAssist() {
    if (this.lastSimulationKey === 0) return;

    this.lastSimulationKey = 0;
    this.table.state.balls.forEach((ball) => ball.clearCollisionPoints());
  }

  public updateAimAssist(shot: Shot) {
    if (
      Math.abs(this.lastSimulationKey - this.getKey(shot)) < properties.epsilon
    ) {
      return;
    }
    const end = Game.profiler.startProfile('aim');
    this.clearAimAssist();

    console.time('simulate');
    const result = this.run(shot, true);

    // add final resting points
    result.state?.balls.forEach((ball) => ball.addCollisionPoint());
    console.timeEnd('simulate');

    this.lastSimulationKey = this.getKey(shot);
    end();
    Game.profiler.dump();
  }
}
