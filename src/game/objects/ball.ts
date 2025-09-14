import {
  ArrowHelper,
  Color,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import { PhysicsBall } from '../physics/ball';
import type { Shot } from '../physics/shot';
import { Cushion } from './cushion';
import { createBallTexture } from '../create-ball-texture';
import type { Collision } from '../physics/collision';
import { Pocket } from './pocket';
import { properties } from '../physics/properties';
import { Game } from '../game';

export class Ball {
  private physics: PhysicsBall;

  public number: number;
  private color: Color;

  public parent!: Object3D;
  private mesh!: Mesh;

  private debugStateRing!: Mesh;
  private debugArrowCV!: ArrowHelper;
  private debugArrowV!: ArrowHelper;
  private debugArrowW!: ArrowHelper;

  constructor(x: number, y: number, color: Color, number: number = -1) {
    this.physics = new PhysicsBall(x, y);
    this.color = color;
    this.number = number;
    this.parent = new Object3D();
    this.parent.position.add(this.physics.position);
    this.createMesh();
    this.createDebugMesh();
  }

  private createMesh() {
    const geometry = new SphereGeometry(this.physics.radius);
    const material = new MeshPhongMaterial({
      map: createBallTexture({
        color: `#${this.color.getHexString()}`,
        number: this.number,
      }),
      specular: new Color('#888'),
      shininess: 200,
    });
    this.mesh = new Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.parent.add(this.mesh);
  }

  private createDebugMesh() {
    this.debugStateRing = new Mesh(
      new TorusGeometry(this.physics.radius * 1.05, 0.5),
      new MeshBasicMaterial({ color: 0x00ff00 })
    );
    this.debugStateRing.visible = false;
    this.parent.add(this.debugStateRing);

    this.debugArrowCV = new ArrowHelper(
      new Vector3(1, 0, 0),
      new Vector3(0, 0, 0),
      1,
      0xffff00
    );
    this.debugArrowCV.visible = false;
    this.parent.add(this.debugArrowCV);

    this.debugArrowV = new ArrowHelper(
      new Vector3(1, 0, 0),
      new Vector3(0, 0, 0),
      1,
      0x00ffff
    );
    this.debugArrowV.visible = false;
    this.parent.add(this.debugArrowV);

    this.debugArrowW = new ArrowHelper(
      new Vector3(1, 0, 0),
      new Vector3(0, 0, 0),
      1,
      0xff00ff
    );
    this.debugArrowW.visible = false;
    this.parent.add(this.debugArrowW);
  }

  get position() {
    return this.physics.position;
  }

  get isStationary() {
    return this.physics.isStationary;
  }

  get isPocketed() {
    return this.physics.isPocketed;
  }

  public hit(shot: Shot) {
    this.physics.hit(shot);
  }

  public collide(object: Ball | Cushion | Pocket): Collision | undefined {
    if (object instanceof Ball) {
      return this.physics.collideBall(object.physics);
    }
    if (object instanceof Cushion) {
      return this.physics.collideCushion(object.physics);
    }
    if (object instanceof Pocket) {
      return this.physics.collidePocket(object.physics);
    }
    return undefined;
  }

  public place(x: number, y: number) {
    this.physics.removeFromPocket();

    this.physics.position.set(x, y, 0);
    this.physics.velocity.multiplyScalar(0);
    this.physics.angularVelocity.multiplyScalar(0);
  }

  public update() {
    this.physics.update();
    this.mesh.rotation.setFromQuaternion(this.physics.orientation);

    this.parent.position.sub(this.parent.position);
    this.parent.position.add(this.physics.position);
    this.updateDebug();
  }

  private updateDebug() {
    const { debugBalls } = properties;
    this.debugStateRing.visible = debugBalls;
    this.debugArrowCV.visible = debugBalls;
    this.debugArrowV.visible = debugBalls;
    this.debugArrowW.visible = debugBalls;

    if (!debugBalls) return;

    let color = 0x888888;
    if (this.physics.isStationary) color = 0xffffff;
    else if (this.physics.isSliding) color = 0xff0000;
    else if (this.physics.isRolling) color = 0x00ffff;
    else if (this.physics.isSpinning) color = 0xff00ff;
    (this.debugStateRing.material as MeshBasicMaterial).color = new Color(
      color
    );
    this.debugStateRing.lookAt(Game.instance.camera.position);

    const cv = this.physics.contactVelocity.clone();
    this.debugArrowCV.setDirection(cv.clone().normalize());
    this.debugArrowCV.setLength(cv.length());

    const v = this.physics.velocity.clone();
    this.debugArrowV.setDirection(v.clone().normalize());
    this.debugArrowV.setLength(v.length());

    const w = this.physics.angularVelocity.clone();
    this.debugArrowW.setDirection(w.clone().normalize());
    this.debugArrowW.setLength(w.length());
  }
}
