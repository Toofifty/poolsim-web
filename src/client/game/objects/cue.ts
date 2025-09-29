import { Mesh, Object3D, Vector3 } from 'three';
import type { Vec } from '../../../common/math';
import { params } from '../../../common/simulation/physics/params';
import { properties } from '../../../common/simulation/physics/properties';
import { Shot } from '../../../common/simulation/shot';
import { dlerp } from '../dlerp';
import { Game } from '../game';
import { createCueMeshes } from '../models/cue/create-cue-meshes';
import { gameStore } from '../store/game';
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

  public static MAX_FORCE = properties.cueMaxForce;

  public isShooting = false;

  private restingPositionY = -(
    properties.cueLength / 2 +
    params.ball.radius * 1.5
  );

  constructor() {
    this.createMesh();
    this.anchor.rotation.z = Math.PI;
  }

  private createMesh() {
    const { cue, lift, anchor } = createCueMeshes();
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
    const position = this.targetBall.position.clone();
    const angle = Math.atan2(point[1] - position.y, point[0] - position.x);
    this.anchor.rotation.z = angle - Math.PI / 2;
    this.object.position.y = this.restingPositionY;
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
      properties.cuePullBackTime
    );
    Game.audio.play('hit_centre', this.object.position, this.force / 2);
    await dlerp(
      (v) => (this.object.position.y = v),
      this.object.position.y,
      this.restingPositionY + properties.ballRadius * 0.5,
      properties.cueShootTime
    );
    this.targetBall.hit(this.getShot());
    onShotMade?.();
    await dlerp(
      (v) => (this.object.position.y = v),
      this.object.position.y,
      this.restingPositionY,
      properties.cuePullBackTime
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
    this.object.position.x = -this.sideSpin * params.ball.radius;
    this.object.position.z = this.topSpin * params.ball.radius;

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

  public sync(cue: SerializedCue, balls: Ball[]) {
    this.targetBall = balls.find((ball) => ball.id === cue.targetBallId);
    this.angle = cue.angle;
    this.force = cue.force;
    this.topSpin = cue.topSpin;
    this.sideSpin = cue.sideSpin;
    this.lift = cue.lift;
  }
}
