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
      shot.angle +
      shot.force * 100 +
      shot.sideSpin * 1000 +
      shot.topSpin * 10000
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

    state.balls.forEach((ball) => {
      ball.update();
      if (trackCollisionPoints && trackPath) {
        ball.addTrackingPoint();
      }
    });

    const activeBalls = state.activeBalls;

    // ball <-> ball collisions
    activeBalls.forEach((ball, i) => {
      const rest = activeBalls.slice(i);
      const ballBallCollisions = rest
        .map((other) => ball.collideBall(other))
        .filter((v) => v !== undefined);

      ballBallCollisions.forEach((collision) => {
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
      });

      result.collisions.push(...ballBallCollisions);
    });

    // ball -> pocket collisions
    activeBalls.forEach((ball) => {
      const ballPocketCollisions = this.table.pockets
        .map((pocket) => ball.collidePocket(pocket, simulated))
        .filter((v) => v !== undefined);
      ballPocketCollisions.forEach((collision) => {
        if (collision.initiator.owner.number === -1) {
          result.pottedCueBall = true;
        } else {
          result.ballsPotted++;
        }

        if (trackCollisionPoints) {
          collision.initiator.owner.addCollisionPoint();
        }
      });

      result.collisions.push(...ballPocketCollisions);
    });

    // ball -> cushion collisions
    activeBalls.forEach((ball) => {
      const ballCushionCollisions = this.table.cushions
        .map((cushion) => ball.collideCushion(cushion))
        .filter((v) => v !== undefined);
      ballCushionCollisions.forEach((collision) => {
        if (collision.initiator.owner.number === -1) {
          result.cueBallCushionCollisions++;
        } else {
          result.ballCushionCollisions++;
        }

        if (trackCollisionPoints) {
          collision.initiator.owner.addCollisionPoint();
        }
      });

      result.collisions.push(...ballCushionCollisions);
    });

    if (!simulated) {
      this.current.add(result);
    }

    return result;
  }

  public run(shot: Shot, trackCollisionPoints?: boolean) {
    const copiedState = this.table.state.clone();
    const result = new Result(copiedState);

    copiedState.cueBall.hit(shot);

    for (let i = 0; i < properties.maxIterations; i++) {
      result.add(
        this.step(
          copiedState,
          trackCollisionPoints,
          trackCollisionPoints ? i : -1
        )
      );

      if (copiedState.settled) {
        break;
      }
    }

    return result;
  }

  public clearAimAssist() {
    if (this.lastSimulationKey === 0) return;

    this.lastSimulationKey = 0;
    this.table.state.balls.forEach((ball) => ball.clearCollisionPoints());
  }

  public updateAimAssist(shot: Shot) {
    if (this.lastSimulationKey === this.getKey(shot)) return;
    this.clearAimAssist();

    const result = this.run(shot, true);

    // add final resting points
    result.state?.balls.forEach((ball) => ball.addCollisionPoint());

    this.lastSimulationKey = this.getKey(shot);
  }
}
