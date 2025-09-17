import { Mesh, Object3D, Vector3 } from 'three';
import { properties } from '../physics/properties';
import type { Ball } from './ball';
import { Shot } from '../physics/shot';
import { Game } from '../game';
import { gameStore } from '../store/game';
import { dlerp } from '../dlerp';
import { createCueMeshes } from '../models/cue/create-cue-meshes';

export class Cue {
  private targetBall?: Ball;
  public anchor!: Object3D;
  private object!: Object3D;

  get force() {
    return gameStore.cueForce;
  }
  set force(force: number) {
    gameStore.cueForce = force;
  }

  public static MAX_FORCE = properties.cueMaxForce;

  public isShooting = false;

  private restingPositionY = -(
    properties.cueLength / 2 +
    properties.ballRadius * 1.5
  );

  constructor() {
    this.createMesh();
  }

  private createMesh() {
    const { cue, anchor } = createCueMeshes();
    this.anchor = anchor;
    this.object = cue;
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

  public setTarget(point: Vector3) {
    if (this.isShooting || !this.targetBall || !this.targetBall.isStationary) {
      return;
    }
    const position = this.targetBall.position.clone();
    const angle = Math.atan2(point.y - position.y, point.x - position.x);
    this.anchor.rotation.z = angle - Math.PI / 2;
    this.object.position.y = this.restingPositionY;
  }

  public get angle() {
    return this.anchor.rotation.z + Math.PI / 2;
  }

  public async shoot(onShotMade?: () => void) {
    if (!this.targetBall || !this.targetBall.isStationary) {
      return;
    }

    this.isShooting = true;
    await dlerp(
      (v) => (this.object.position.y = v),
      this.object.position.y,
      this.restingPositionY - this.force / 2,
      properties.cuePullBackTime
    );
    Game.playAudio('break', this.object.position, this.force / 2);
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
    return new Shot(this.angle, this.force);
  }

  public setShot(shot: Shot) {
    dlerp(
      (v) => (this.anchor.rotation.z = v),
      this.anchor.rotation.z,
      shot.angle - Math.PI / 2,
      250
    );
    dlerp((v) => (this.force = v), this.force, shot.force, 250);
  }

  public update(dt: number = 1 / 60, settled?: boolean) {
    if (!this.isShooting && this.targetBall && settled) {
      this.anchor.position.copy(this.targetBall.position);
    }
  }
}
