import type { TableState } from '../simulation/table-state';
import type { PhysicsBall, PhysicsBallSnapshot } from './ball';
import type { Collision } from './collision';
import type { Shot } from './shot';

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
  trackingPoints: { id: number; snapshot: PhysicsBallSnapshot }[] = [];

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
    this.trackingPoints.push(...other.trackingPoints);
    return this;
  }

  public hasFoul() {
    return (
      this.cueBallCollisions === 0 || this.pottedCueBall || this.hitFoulBall
    );
  }

  public addTrackingPoint(ball: PhysicsBall) {
    this.trackingPoints.push({
      id: ball.id,
      snapshot: ball.snapshot(),
    });
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
