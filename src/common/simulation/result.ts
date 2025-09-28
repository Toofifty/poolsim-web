import type { Collision } from './collision';
import type { PhysicsBall, PhysicsBallSnapshot } from './physics';
import type { Shot } from './shot';
import type { TableState } from './table-state';

export class Result {
  stepIterations = 1;
  ballsPotted = 0;
  pottedCueBall = false;
  hitFoulBall = false;
  /** e.g. shot backwards on break */
  invalidShot = false;
  firstStruck: number | undefined = undefined;

  cueBallCollisions = 0;
  cueBallCushionCollisions = 0;

  ballBallCollisions = 0;
  ballCushionCollisions = 0;

  collisions: Collision[] = [];
  trackingPoints: { id: number; snapshot: PhysicsBallSnapshot }[] = [];

  constructor(public shot?: Shot, public state?: TableState) {}

  public add(other: Result) {
    if (
      this.state &&
      this.state.is9Ball &&
      this.firstStruck === undefined &&
      other.firstStruck !== undefined
    ) {
      // adding a strike - if it's not the lowest ball, it is a foul
      this.hitFoulBall = this.state.lowestActiveBallId !== other.firstStruck;
    }

    this.stepIterations += other.stepIterations;
    this.ballsPotted += other.ballsPotted;
    this.pottedCueBall ||= other.pottedCueBall;
    this.hitFoulBall ||= other.hitFoulBall;
    this.invalidShot ||= other.invalidShot;
    this.firstStruck =
      this.firstStruck === -1 ? other.firstStruck : this.firstStruck;
    this.cueBallCollisions += other.cueBallCollisions;
    this.cueBallCushionCollisions += other.cueBallCushionCollisions;
    this.ballBallCollisions += other.ballBallCollisions;
    this.ballCushionCollisions += other.ballCushionCollisions;
    this.collisions.push(...other.collisions);
    this.trackingPoints.push(...other.trackingPoints);
    return this;
  }

  public hasOutOfBoundsBall() {
    return !!this.state?.hasOutOfBoundsBall();
  }

  public hasFoul() {
    return (
      this.cueBallCollisions === 0 ||
      this.pottedCueBall ||
      this.hitFoulBall ||
      this.invalidShot ||
      this.hasOutOfBoundsBall()
    );
  }

  public addTrackingPoint(ball: PhysicsBall) {
    this.trackingPoints.push({
      id: ball.id,
      snapshot: ball.snapshot(),
    });
  }
}

/** @deprecated */
export class StepResult extends Result {}
