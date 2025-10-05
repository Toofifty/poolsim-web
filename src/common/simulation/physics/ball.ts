import { quat, vec, type Quat, type Vec } from '../../math';
import { solveQuadraticRoots } from '../../math/solve';
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
import type { StaticParams } from './default-params';
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
  OutOfPlay,
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
    public params: StaticParams,
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
    newBall.state = this.state;
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

    const dv = vec.mult(direction, vec.len(shot.velocity));
    // contribute less to vertical velocity based on where the cue ball is hit
    dv[2] *= Math.cos((shot.sideSpin * Math.PI) / 2);
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

  public place(x: number, y: number) {
    this.removeFromPocket();

    vec.mset(this.position, x, y, 0);
    vec.mmult(this.velocity, 0);
    vec.mmult(this.angularVelocity, 0);

    this.state = BallState.Stationary;
  }

  public minimize() {
    const cv = vec.len(this.getContactVelocity());
    if (cv < 1e-8 && cv > 0) {
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
      case this.state === BallState.OutOfPlay:
        return BallState.OutOfPlay;
      case this.isPocketed:
        return BallState.Pocketed;
      case this.r[2] > 0:
        return BallState.Airborne;
      case vec.lenSq(this.getContactVelocity()) > 0:
        return BallState.Sliding;
      case vec.lenSq(this.velocity) > 0:
        return BallState.Rolling;
      case Math.abs(this.angularVelocity[2]) > 0:
        return BallState.Spinning;
      default:
        return BallState.Stationary;
    }
  }

  public getSlideTime(): number {
    if (this.params.ball.frictionSlide === 0) {
      return Infinity;
    }

    return (
      (2 * vec.len(this.getContactVelocity())) /
      (7 * this.params.ball.frictionSlide)
    );
  }

  public getRollTime(): number {
    if (this.params.ball.frictionRoll === 0) {
      return Infinity;
    }

    return vec.len(this.v) / this.params.ball.frictionRoll;
  }

  public getSpinTime(): number {
    if (this.params.ball.frictionSpin === 0) {
      return Infinity;
    }

    return (
      Math.abs(this.w[2]) * 0.4 * (this.radius / this.params.ball.frictionSpin)
    );
  }

  public getAirTime(): number {
    if (this.r[2] <= 0 && this.v[2] <= 0) {
      return 0;
    }

    const disc =
      this.v[2] * this.v[2] + 2 * this.params.ball.gravity * this.r[2];
    if (disc < 0) return 0;

    return this.v[2] + Math.sqrt(disc) / this.params.ball.gravity;
  }

  private getMomentaryFrictionAccel() {
    const {
      gravity: g,
      frictionSlide: us,
      frictionRoll: ur,
    } = this.params.ball;

    if (this.state === BallState.Sliding) {
      const u0 = vec.norm(this.getContactVelocity());
      return vec.mult(u0, -us * g);
    }

    if (this.state === BallState.Rolling) {
      const vh = vec.norm(this.v);
      return vec.mult(vh, -ur * g);
    }

    return vec.zero;
  }

  private getMomentaryFrictionDelta(dt: number) {
    return vec.mult(this.getMomentaryFrictionAccel(), dt);
  }

  public computeCollisionTime(other: PhysicsBall, dt: number) {
    if (this === other) return Infinity;
    if (this.isStationary && other.isStationary) return Infinity;

    const thisV = vec.add(this.v, this.getMomentaryFrictionDelta(dt));
    const otherV = vec.add(other.v, other.getMomentaryFrictionDelta(dt));

    const dr = vec.sub(this.r, other.r);
    const dv = vec.sub(thisV, otherV);
    if (vec.dot(dr, dv) >= 0) return Infinity;

    const R = this.radius + other.radius;

    const a = vec.dot(dv, dv);
    if (a === 0) return Infinity;

    const b = 2 * vec.dot(dr, dv);
    const c = vec.dot(dr, dr) - R * R;

    const disc = b * b - 4 * a * c;
    if (disc < 0) return Infinity;
    const sqrtDisc = Math.sqrt(disc);

    const t1 = (-b - sqrtDisc) / (2 * a);
    const t2 = (-b + sqrtDisc) / (2 * a);

    if (t1 >= 0 && t1 < dt) return t1;
    if (t2 >= 0 && t2 < dt) return t2;
    return Infinity;
  }

  public computeCushionCollisionTime(cushion: PhysicsCushion, dt: number) {
    if (this.isStationary) return Infinity;

    const p0 = this.r;
    const a = this.getMomentaryFrictionAccel();
    const v0 = this.v;
    const R = this.radius;

    let bestT = Infinity;
    for (const [A, B] of cushion.segments) {
      const edge = vec.sub(B, A);
      const edgeLen = vec.len(edge);
      const edgeDir = vec.norm(edge);
      const normal = vec.perp(edgeDir);

      const d0 = vec.dot(normal, vec.sub(p0, A));
      const vn = vec.dot(normal, v0);
      const an = vec.dot(normal, a);

      for (const sign of [+1, -1]) {
        const c = d0 - sign * R;
        for (let t of solveQuadraticRoots(0.5 * an, vn, c)) {
          if (t <= 1e-8 || t >= dt || t >= bestT) continue;

          const pt = vec.add(
            p0,
            vec.add(vec.mult(v0, t), vec.mult(a, 0.5 * t * t))
          );
          const rel = vec.sub(pt, A);
          const u = vec.dot(rel, edgeDir);
          if (u >= 0 && u <= edgeLen) {
            bestT = t;
          }
        }
      }

      // endpoint collisions
      // for (const P of [A, B]) {
      //   for (const t of solveQuadraticPointCollisionRoots(p0, v0, R, P)) {
      //     if (t > 1e-8 && t < bestT) bestT = t;
      //   }
      // }
    }

    return bestT;
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

  public collideBall(
    other: PhysicsBall,
    fixOverlap = true
  ): BallBallCollision | undefined {
    return collideBallBall(this, other, fixOverlap);
  }

  public collideCushion(
    cushion: PhysicsCushion,
    fixOverlap = true
  ): BallCushionCollision | undefined {
    return collideBallCushion(this, cushion, fixOverlap);
  }

  public collidePocket(pocket: PhysicsPocket): BallPocketCollision | undefined {
    return collideBallPocket(this, pocket);
  }

  public addToPocket(pocket: PhysicsPocket, simulated?: boolean) {
    this.pocket = pocket;
    this.state = BallState.Pocketed;
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
