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
  public force = 100;

  public static MAX_FORCE = 200;

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
    this.object.position.y -=
      properties.cueLength / 2 + properties.ballRadius + 2;
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
    if (!this.targetBall || !this.targetBall.isStationary) {
      return;
    }
    const position = this.targetBall.position.clone();
    const angle = Math.atan2(point.y - position.y, point.x - position.x);
    this.anchor.rotation.z = angle - Math.PI / 2;
  }

  public getAngle() {
    return this.anchor.rotation.z + Math.PI / 2;
  }

  public shoot() {
    if (!this.targetBall || !this.targetBall.isStationary) {
      return;
    }

    this.targetBall.hit(new Shot(this.getAngle(), this.force));
  }

  public update() {
    if (this.targetBall && this.targetBall.isStationary) {
      this.anchor.position.copy(this.targetBall.position);
    }
  }
}
