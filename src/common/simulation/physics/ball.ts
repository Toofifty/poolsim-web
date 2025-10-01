import { quat, vec, type Quat, type Vec } from '../../math';
import { assert } from '../../util';
import type {
  BallBallCollision,
  BallCushionCollision,
  BallPocketCollision,
} from '../collision';
import type { Shot } from '../shot';
import {
  collideBallBall,
  collideBallCushion,
  collideBallPocket,
} from './ball/collide';
import {
  evolveBallMotion,
  evolveBallOrientation,
  evolvePocket,
} from './ball/evolve';
import { PhysicsCushion } from './cushion';
import { params, type Params } from './params';
import type { PhysicsPocket } from './pocket';

export type SerializedPhysicsBall = {
  id: number;
  position: Vec;
  velocity: Vec;
  angularVelocity: Vec;
  radius: number;
  orientation: Quat;
  state: BallState;
  pocketId?: number;
};

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
  Airborne,
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

  constructor(
    private params: Params,
    public id: number,
    position: Vec,
    orientation: Quat
  ) {
    this.position = position;
    this.velocity = vec.new(0, 0, 0);
    this.angularVelocity = vec.new(0, 0, 0);

    this.radius = params.ball.radius;
    this.orientation = orientation;
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
    const newBall = new PhysicsBall(
      this.params,
      this.id,
      vec.clone(this.r),
      quat.clone(this.orientation)
    );
    vec.mcopy(newBall.v, this.v);
    vec.mcopy(newBall.w, this.w);
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
    let direction = vec.norm(shot.velocity);
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
      const r = vec.mult(
        up,
        shot.topSpin * this.params.ball.spinMultiplier * this.radius
      );
      const dw = vec.mult(vec.cross(r, direction), 1 / I);
      vec.madd(this.w, dw);
    }

    if (Math.abs(shot.sideSpin) > 0) {
      const r = vec.mult(
        right,
        shot.sideSpin * this.params.ball.spinMultiplier * this.radius
      );
      const dw = vec.mult(vec.cross(r, direction), 1 / I);
      vec.madd(this.w, dw);
    }

    // contribute less to velocity based on where the cue ball is hit
    const vContribution =
      Math.cos((shot.topSpin * Math.PI) / 2) *
      Math.cos((shot.sideSpin * Math.PI) / 2);
    const dv = vec.mult(direction, vContribution * vec.len(shot.velocity));
    vec.madd(this.v, dv);
  }

  get isPocketed() {
    return !!this.pocket;
  }

  get isPocketedStationary() {
    return this.isPocketed && vec.isZero(this.v);
  }

  get isOutOfBounds() {
    const {
      table: { width, length },
    } = this.params;
    return (
      !this.isPocketed &&
      (this.r[0] > length / 2 ||
        this.r[0] < -length / 2 ||
        this.r[1] > width / 2 ||
        this.r[1] < -width / 2)
    );
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

  get isAirborne() {
    return this.r[2] > 0;
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
        return BallState.Pocketed;
      case this.r[2] > 0:
        return BallState.Airborne;
      case vec.len(this.getContactVelocity()) > 0:
        return BallState.Sliding;
      case vec.len(this.velocity) > 0:
        return BallState.Rolling;
      case Math.abs(this.angularVelocity[2]) > 0:
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

  public getAirTime(): number {
    if (this.r[2] <= 0 && this.v[2] <= 0) {
      return 0;
    }

    const disc = this.v[2] * this.v[2] + 2 * params.ball.gravity * this.r[2];
    if (disc < 0) return 0;

    return this.v[2] + Math.sqrt(disc) / params.ball.gravity;
  }

  public evolve(dt: number, simulated?: boolean) {
    this.state = this.resolveState();

    if (this.pocket) {
      // if (simulated) return;
      evolvePocket(this, this.pocket, dt);
      evolveBallOrientation(this, dt);
      this.minimize();
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

  public collidePocket(pocket: PhysicsPocket): BallPocketCollision | undefined {
    return collideBallPocket(this, pocket);
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
    this.state = BallState.Stationary;
  }

  public serialize() {
    return {
      id: this.id,
      position: this.position,
      velocity: this.velocity,
      angularVelocity: this.angularVelocity,
      orientation: this.orientation,
      radius: this.radius,
      state: this.state,
      pocketId: this.pocket?.id,
    } satisfies SerializedPhysicsBall;
  }

  public sync(ball: SerializedPhysicsBall, pockets: PhysicsPocket[]) {
    this.id = ball.id;
    this.position = ball.position;
    this.velocity = ball.velocity;
    this.angularVelocity = ball.angularVelocity;
    this.orientation = ball.orientation;
    this.radius = ball.radius;
    this.state = ball.state;
    this.pocket = pockets.find((pocket) => pocket.id === ball.pocketId);
  }
}
