import { vec } from '../math';
import type { Collision } from './collision';
import { type PhysicsBall, type PhysicsBallSnapshot } from './physics';
import type { Shot } from './shot';
import { type TableState } from './table-state';

export class Result {
  stepIterations = 1;
  ballsPotted: number[] = [];
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
  trackingPointMap: Map<number, PhysicsBallSnapshot[]> = new Map();

  constructor(public shot?: Shot, public state?: TableState) {
    state?.balls.forEach((ball) => {
      this.trackingPointMap.set(ball.id, [ball.snapshot()]);
    });
  }

  public setFirstStruck(id: number) {
    this.firstStruck = id;
    if (this.state && !this.state.getTargetableBalls().has(id)) {
      this.hitFoulBall = true;
    }
  }

  public add(other: Result) {
    this.stepIterations += other.stepIterations;
    this.ballsPotted.push(...other.ballsPotted);
    this.pottedCueBall ||= other.pottedCueBall;
    this.hitFoulBall ||= other.hitFoulBall;
    this.invalidShot ||= other.invalidShot;
    this.firstStruck ??= other.firstStruck;
    this.cueBallCollisions += other.cueBallCollisions;
    this.cueBallCushionCollisions += other.cueBallCushionCollisions;
    this.ballBallCollisions += other.ballBallCollisions;
    this.ballCushionCollisions += other.ballCushionCollisions;
    this.collisions.push(...other.collisions);

    for (const [ballId, trackingPoints] of other.trackingPointMap) {
      if (!this.trackingPointMap.has(ballId)) {
        this.trackingPointMap.set(ballId, trackingPoints);
      } else {
        this.trackingPointMap.get(ballId)?.push(...trackingPoints);
      }
    }

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
    const trackingPoints = this.trackingPointMap.get(ball.id);
    const lastPoint = trackingPoints?.at(-1)!;
    // do not add tracking points if the ball hasn't moved
    if (
      trackingPoints &&
      lastPoint &&
      !vec.eq(lastPoint.position, ball.position, 1e-3)
    ) {
      trackingPoints.push(ball.snapshot());
    }
  }
}

/** @deprecated */
export class StepResult extends Result {}
