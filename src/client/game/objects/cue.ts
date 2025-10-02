import { Mesh, Object3D, Vector3 } from 'three';
import { vec, type Vec } from '../../../common/math';
import { defaultParams, type Params } from '../../../common/simulation/physics';
import { Shot } from '../../../common/simulation/shot';
import { constrain } from '../../../common/util';
import { dlerp, dlerpAngle } from '../dlerp';
import { Game } from '../game';
import { createCueMeshes } from '../models/cue/create-cue-meshes';
import { gameStore } from '../store/game';
import { settings } from '../store/settings';
import { makeTheme } from '../store/theme';
import { subscribeTo } from '../util/subscribe';
import type { Ball } from './ball';

export type SerializedCue = {
  targetBallId?: number;
  angle: number;
  force: number;
  topSpin: number;
  sideSpin: number;
  lift: number;
};

export class Cue {
  private targetBall?: Ball;
  public anchor!: Object3D;
  private object!: Object3D;
  private liftAnchor!: Object3D;

  set angle(angle: number) {
    this.anchor.rotation.z = angle - Math.PI / 2;
  }

  get force() {
    return gameStore.cueForce;
  }
  set force(force: number) {
    gameStore.cueForce = force;
  }

  get topSpin() {
    return -gameStore.cueSpinY;
  }
  set topSpin(value: number) {
    gameStore.cueSpinY = -value;
  }

  get sideSpin() {
    return -gameStore.cueSpinX;
  }
  set sideSpin(value: number) {
    gameStore.cueSpinX = -value;
  }

  get lift() {
    return gameStore.cueLift;
  }
  set lift(value: number) {
    gameStore.cueLift = value;
  }

  public isShooting = false;
  private restingPositionY: number;

  constructor(private params: Params) {
    this.createMesh();
    this.anchor.rotation.z = Math.PI;
    this.restingPositionY = -(params.cue.length / 2 + params.ball.radius * 1.5);
    this.object.position.y = this.restingPositionY;

    subscribeTo(params, ['cue.length', 'ball.radius'], () => {
      this.restingPositionY = -(
        params.cue.length / 2 +
        params.ball.radius * 1.5
      );
    });
  }

  private createMesh() {
    const { cue, lift, anchor } = createCueMeshes(this.params, makeTheme());
    this.object = cue;
    this.liftAnchor = lift;
    this.anchor = anchor;
    this.object.position.y = this.restingPositionY;
    Game.reflectives.push(...(cue.children as Mesh[]));
  }

  public attachTo(ball: Ball) {
    this.detach();
    this.targetBall = ball;
    this.anchor.position.copy(this.targetBall.position);
  }

  public detach() {
    if (this.targetBall) {
      this.targetBall = undefined;
    }
  }

  public setTarget(point: Vec) {
    if (this.isShooting || !this.targetBall || !this.targetBall.isStationary) {
      return false;
    }

    const position = this.targetBall.physics.position;
    const angle = Math.atan2(point[1] - position[1], point[0] - position[0]);
    this.anchor.rotation.z = angle - Math.PI / 2;
    this.object.position.y = this.restingPositionY;

    if (settings.distanceBasedPower) {
      const dist = vec.dist(position, point);
      this.force = constrain(dist * 2, 0, this.params.cue.maxForce);
    }
  }

  public get position() {
    return this.targetBall?.physics.position ?? vec.zero;
  }

  public get angle() {
    return this.anchor.rotation.z + Math.PI / 2;
  }

  public async shoot(onShotMade?: () => void) {
    if (!this.targetBall || !this.targetBall.isStationary || this.isShooting) {
      return;
    }

    this.isShooting = true;
    await dlerp(
      (v) => (this.object.position.y = v),
      this.object.position.y,
      this.restingPositionY - this.force / 2,
      this.params.cue.pullBackTime
    );
    Game.audio.play('hit_centre', this.object.position, this.force / 2);
    await dlerp(
      (v) => (this.object.position.y = v),
      this.object.position.y,
      this.restingPositionY + this.params.ball.radius * 0.5,
      this.params.cue.shootTime
    );
    this.targetBall.hit(this.getShot());
    onShotMade?.();
    await dlerp(
      (v) => (this.object.position.y = v),
      this.object.position.y,
      this.restingPositionY,
      this.params.cue.pullBackTime
    );
    this.isShooting = false;
  }

  public getShot() {
    return new Shot(
      this.angle,
      this.force,
      this.sideSpin,
      this.topSpin,
      this.lift
    );
  }

  public setShot(shot: Shot) {
    dlerp(
      (v) => (this.anchor.rotation.z = v),
      this.anchor.rotation.z,
      shot.angle - Math.PI / 2,
      250
    );
    dlerp((v) => (this.force = v), this.force, shot.force, 250);
    dlerp((v) => (this.sideSpin = v), this.sideSpin, shot.sideSpin, 250);
    dlerp((v) => (this.topSpin = v), this.topSpin, shot.topSpin, 250);
    dlerp((v) => (this.lift = v), this.lift, shot.lift, 250);
  }

  public update(dt: number = 1 / 60, settled?: boolean) {
    // update positon for spin from UI
    this.object.position.x = -this.sideSpin * this.params.ball.radius;
    this.object.position.z = this.topSpin * this.params.ball.radius;

    this.liftAnchor.setRotationFromAxisAngle(
      new Vector3(1, 0, 0),
      -Math.PI / 48 - this.lift
    );

    if (!this.isShooting && this.targetBall && settled) {
      this.anchor.position.copy(this.targetBall.position);
    }
  }

  public serialize() {
    return {
      targetBallId: this.targetBall?.id,
      angle: this.angle,
      force: this.force,
      topSpin: this.topSpin,
      sideSpin: this.sideSpin,
      lift: this.lift,
    } satisfies SerializedCue;
  }

  public sync(cue: SerializedCue, balls: Ball[], immediate = false) {
    this.targetBall = balls.find((ball) => ball.id === cue.targetBallId);

    if (immediate) {
      this.angle = cue.angle;
      this.force = cue.force;
      this.topSpin = cue.topSpin;
      this.sideSpin = cue.sideSpin;
      this.lift = cue.lift;
    } else {
      const t = defaultParams.network.throttle;

      dlerpAngle((v) => (this.angle = v), this.angle, cue.angle, t);
      dlerp((v) => (this.force = v), this.force, cue.force, t);
      dlerp((v) => (this.topSpin = v), this.topSpin, cue.topSpin, t);
      dlerp((v) => (this.sideSpin = v), this.sideSpin, cue.sideSpin, t);
      dlerp((v) => (this.lift = v), this.lift, cue.lift, t);
    }
  }
}
