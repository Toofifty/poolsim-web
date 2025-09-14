import {
  Color,
  CylinderGeometry,
  Mesh,
  MeshLambertMaterial,
  MeshPhongMaterial,
  Object3D,
  SphereGeometry,
  Vector3,
} from 'three';
import { properties } from '../physics/properties';
import type { Ball } from './ball';
import { Shot } from '../physics/shot';

export class Cue {
  private targetBall?: Ball;
  public anchor!: Object3D;
  private object!: Object3D;

  // force in cm/s
  public force = 50;

  public static MAX_FORCE = 100;

  private pullBackTimeLeft = 0;
  private pushForwardTimeLeft = 0;

  private onShotMade?: () => void;

  private restingPosition = new Vector3(
    0,
    -(properties.cueLength / 2 + properties.ballRadius + 2),
    0
  );

  constructor() {
    this.createMesh();
  }

  private createMesh() {
    this.anchor = new Object3D();
    this.object = new Object3D();
    const tip = new Mesh(
      new SphereGeometry(properties.cueTipRadius),
      new MeshLambertMaterial({ color: '#88F' })
    );
    tip.position.y = properties.cueLength / 2;
    const handle = new Mesh(
      new CylinderGeometry(
        properties.cueTipRadius,
        properties.cueHandleRadius,
        properties.cueLength
      ),
      new MeshPhongMaterial({
        color: '#812e04',
        specular: new Color('#812e04'),
        shininess: 50,
      })
    );
    handle.castShadow = true;
    this.object.add(tip);
    this.object.add(handle);
    this.object.position.copy(this.restingPosition);
    this.anchor.add(this.object);
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
    this.object.position.copy(this.restingPosition);
  }

  public get angle() {
    return this.anchor.rotation.z + Math.PI / 2;
  }

  public shoot(onShotMade?: () => void) {
    if (!this.targetBall || !this.targetBall.isStationary) {
      return;
    }

    this.pullBackTimeLeft = properties.cuePullBackTime;
    this.onShotMade = onShotMade;
  }

  public getShot() {
    return new Shot(this.angle, this.force);
  }

  public get isShooting() {
    return this.pullBackTimeLeft > 0 || this.pushForwardTimeLeft > 0;
  }

  public update(dt: number = 1 / 60) {
    if (this.isShooting) {
      if (this.pullBackTimeLeft > 0) {
        this.object.position.lerp(
          new Vector3(0, -this.force / 2 + this.restingPosition.y, 0),
          dt / this.pullBackTimeLeft
        );
        this.pullBackTimeLeft -= dt;
        if (this.pullBackTimeLeft <= 0) {
          dt += this.pullBackTimeLeft;
          this.pushForwardTimeLeft = 10 / this.force;
        }
      }

      if (this.pushForwardTimeLeft > 0) {
        this.object.position.lerp(
          new Vector3(
            0,
            -(properties.cueLength / 2 + properties.ballRadius),
            0
          ),
          dt / this.pushForwardTimeLeft
        );
        this.pushForwardTimeLeft -= dt;
        if (this.pushForwardTimeLeft <= 0) {
          this.pushForwardTimeLeft = 0;
          this.targetBall?.hit(this.getShot());
          this.onShotMade?.();
          this.onShotMade = undefined;
        }
      }

      return;
    }

    if (this.targetBall) {
      this.anchor.position.copy(this.targetBall.position);
    }
  }
}
