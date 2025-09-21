import { properties } from './properties';
import type { Shot } from './shot';
import { PhysicsCushion } from './cushion';
import type {
  BallBallCollision,
  BallCushionCollision,
  BallPocketCollision,
} from './collision';
import type { PhysicsPocket } from './pocket';
import { params } from './params';
import { assert } from '../assert';
import { vec, quat, type Quat, type Vec } from './math';
import { evolveBallMotion, evolveBallOrientation } from './ball/evolve';
import {
  collideBallBall,
  collideBallCushion,
  collideBallPocket,
} from './ball/collide';

export type PhysicsBallSnapshot = {
  position: Vec;
  velocity: Vec;
  orientation: Quat;
  state: BallState;
};

export enum BallState {
  Stationary,
  Sliding,
  Rolling,
  Spinning,
  Pocketed,
}

export class PhysicsBall {
  public position: Vec;
  public velocity: Vec;
  public angularVelocity: Vec;
  public state: BallState;

  public radius: number;
  public orientation: Quat;

  public pocket?: PhysicsPocket;

  constructor(public id: number, x: number, y: number) {
    this.position = vec.new(x, y, 0);
    this.velocity = vec.new(0, 0, 0);
    this.angularVelocity = vec.new(0, 0, 0);

    this.radius = properties.ballRadius;
    this.orientation = quat.random();
    this.state = BallState.Stationary;
  }

  get r() {
    return this.position;
  }

  get v() {
    return this.velocity;
  }

  get w() {
    return this.angularVelocity;
  }

  public clone() {
    const newBall = new PhysicsBall(this.id, this.r[0], this.r[1]);
    vec.mcopy(newBall.r, this.r);
    vec.mcopy(newBall.v, this.v);
    vec.mcopy(newBall.w, this.w);
    quat.mcopy(newBall.orientation, this.orientation);
    newBall.pocket = this.pocket;
    return newBall;
  }

  public snapshot(
    override?: Partial<PhysicsBallSnapshot>
  ): PhysicsBallSnapshot {
    return {
      position: override?.position ?? vec.clone(this.r),
      velocity: override?.velocity ?? vec.clone(this.v),
      orientation: override?.orientation ?? quat.clone(this.orientation),
      state: this.state,
    };
  }

  public hit(shot: Shot) {
    let direction = vec.norm(vec.from(shot.velocity));
    if (shot.lift > 0) {
      // apply vertical angle
      const right = vec.norm(vec.cross(vec.UP, direction));
      direction = vec.norm(vec.rotate(direction, right, shot.lift));
    }
    const I = 0.4 * this.radius * this.radius;

    const right = vec.norm(vec.cross(vec.UP, direction));
    const up = vec.norm(vec.cross(direction, right));

    // apply spins
    if (Math.abs(shot.topSpin) > 0) {
      const r = vec.mult(up, shot.topSpin * this.radius);
      const dw = vec.mult(vec.cross(r, direction), 1 / I);
      vec.madd(this.w, dw);
    }

    if (Math.abs(shot.sideSpin) > 0) {
      const r = vec.mult(right, shot.sideSpin * this.radius);
      const dw = vec.mult(vec.cross(r, direction), 1 / I);
      vec.madd(this.w, dw);
    }

    const dv = vec.mult(direction, shot.velocity.length());
    vec.madd(this.v, dv);
  }

  get isPocketed() {
    return !!this.pocket;
  }

  getContactVelocity() {
    if (this.isPocketed) {
      return vec.zero;
    }

    return this.getSurfaceVelocity(vec.new(0, 0, 1));
  }

  getSurfaceVelocity(normal: Vec) {
    const relativeVelocity = vec.cross(vec.mult(normal, this.radius), this.w);
    return vec.minimise(vec.add(this.v, relativeVelocity));
  }

  getIdealAngularVelocity() {
    const wXY = vec.mult(
      vec.norm(vec.cross(vec.UP, this.v)),
      vec.len(this.v) / this.radius
    );
    return vec.setZ(wXY, this.w[2]);
  }

  private updatePocket(dt: number) {
    // move the ball in the pocket
    this.v[2] -= params.ball.gravity * dt;
    vec.madd(this.r, vec.mult(this.v, dt));

    // todo: slow w
  }

  public get isStationary() {
    return this.state === BallState.Stationary;
  }

  public minimize() {
    const cv = this.getContactVelocity();
    if (vec.len(cv) < 1e-8 && vec.len(cv) > 0) {
      vec.mcopy(this.w, this.getIdealAngularVelocity());
      assert(
        vec.isZero(this.getContactVelocity()),
        'Could not zero-out contact velocity'
      );
    }

    vec.mminimise(this.v);
    vec.mminimise(this.w);
  }

  private resolveState(): BallState {
    this.minimize();

    switch (true) {
      case this.isPocketed:
        return BallState.Stationary;
      case vec.len(this.getContactVelocity()) > 0:
        return BallState.Sliding;
      case vec.len(this.velocity) > 0:
        return BallState.Rolling;
      case this.angularVelocity[2] > 0:
        return BallState.Spinning;
      default:
        return BallState.Stationary;
    }
  }

  public getSlideTime(): number {
    if (params.ball.frictionSlide === 0) {
      return Infinity;
    }

    return (
      (2 * vec.len(this.getContactVelocity())) / (7 * params.ball.frictionSlide)
    );
  }

  public getRollTime(): number {
    if (params.ball.frictionRoll === 0) {
      return Infinity;
    }

    return vec.len(this.v) / params.ball.frictionRoll;
  }

  public getSpinTime(): number {
    if (params.ball.frictionSpin === 0) {
      return Infinity;
    }

    return Math.abs(this.w[2]) * 0.4 * (this.radius / params.ball.frictionSpin);
  }

  public evolve(dt: number, simulated?: boolean) {
    this.state = this.resolveState();

    if (this.isPocketed) {
      if (simulated) return;
      this.updatePocket(dt);
      return;
    }

    evolveBallMotion(this, dt);
    evolveBallOrientation(this, dt);
    this.minimize();
  }

  public collideBall(other: PhysicsBall): BallBallCollision | undefined {
    return collideBallBall(this, other);
  }

  public collideCushion(
    cushion: PhysicsCushion
  ): BallCushionCollision | undefined {
    return collideBallCushion(this, cushion);
  }

  public collidePocket(
    pocket: PhysicsPocket,
    simulated = false
  ): BallPocketCollision | undefined {
    return collideBallPocket(this, pocket, simulated);
  }

  public addToPocket(pocket: PhysicsPocket, simulated?: boolean) {
    this.pocket = pocket;
    if (!simulated) {
      pocket.addBall(this);
    }
  }

  public removeFromPocket() {
    if (!this.pocket) {
      return;
    }

    this.pocket.removeBall(this);
    this.pocket = undefined;
  }
}
