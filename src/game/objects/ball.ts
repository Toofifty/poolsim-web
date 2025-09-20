import {
  BufferGeometry,
  Color,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Quaternion,
  TorusGeometry,
  Vector3,
} from 'three';
import { BallState, PhysicsBall } from '../physics/ball';
import type { Shot } from '../physics/shot';
import { properties } from '../physics/properties';
import { Game } from '../game';
import { settings } from '../store/settings';
import { createBallMesh } from '../models/ball/create-ball-mesh';
import { Arrow } from './arrow';
import {
  createPathMesh,
  type TrackingPoint,
} from '../models/ball/create-path-mesh';
import type { Line2 } from 'three/examples/jsm/Addons.js';
import { quat, vec, type Quat, type Vec } from '../physics/math';

export class Ball {
  public physics: PhysicsBall;

  public number: number;
  private color: Color;

  // simulation
  private collisionPoints: Vector3[] = [];
  private collisionOrientations: Quaternion[] = [];
  private trackingPoints: TrackingPoint[] = [];
  private impactVelocity?: Vector3;

  public parent!: Object3D;
  private mesh!: Mesh;

  private projectionMeshes: Mesh[] = [];
  private trackingLine?: Line2;
  private geometry!: BufferGeometry;
  private projectionMaterial!: Material;
  private impactArrow!: Arrow;

  private debugStateRing!: Mesh;
  private debugArrowCV!: Arrow;
  private debugArrowV!: Arrow;
  private debugArrowW!: Arrow;

  constructor(x: number, y: number, color: Color, number: number = -1) {
    this.physics = new PhysicsBall(number, x, y);
    this.color = color;
    this.number = number;
    this.parent = new Object3D();
    this.parent.position.add(this.position);
    this.createMesh();
    this.createDebugMesh();

    this.updateMesh();
    this.updateDebug();
  }

  private createMesh() {
    const { mesh, projectionMaterial } = createBallMesh({
      radius: this.physics.radius,
      color: this.color,
      number: this.number,
    });
    this.mesh = mesh;
    Game.reflectives.push(this.mesh);
    this.geometry = this.mesh.geometry;
    this.projectionMaterial = projectionMaterial;

    this.parent.add(this.mesh);
    this.impactArrow = new Arrow({
      color: this.color,
      factor: 0.5,
    });
    this.parent.add(this.impactArrow);
  }

  private createDebugMesh() {
    this.debugStateRing = new Mesh(
      new TorusGeometry(this.physics.radius * 1.05, this.physics.radius * 0.1),
      new MeshBasicMaterial({ color: 0x00ff00 })
    );
    this.debugStateRing.visible = false;
    this.parent.add(this.debugStateRing);

    this.debugArrowCV = new Arrow({ color: new Color(0xffff00), factor: 0.2 });
    this.debugArrowCV.position.z = -properties.ballRadius;
    this.debugArrowCV.visible = false;
    this.parent.add(this.debugArrowCV);

    this.debugArrowV = new Arrow({ color: new Color(0x00ffff), factor: 0.2 });
    this.debugArrowV.visible = false;
    this.parent.add(this.debugArrowV);

    this.debugArrowW = new Arrow({ color: new Color(0xff00ff), factor: 0.01 });
    this.debugArrowW.visible = false;
    this.parent.add(this.debugArrowW);
  }

  get id() {
    return this.physics.id;
  }

  get position() {
    return vec.toVector3(this.physics.position);
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

  public place(x: number, y: number) {
    this.physics.removeFromPocket();

    vec.mset(this.physics.position, x, y, 0);
    vec.mmult(this.physics.velocity, 0);
    vec.mmult(this.physics.angularVelocity, 0);

    this.updateMesh();
    this.updateDebug();
  }

  public clearCollisionPoints() {
    this.collisionPoints = [];
    this.collisionOrientations = [];
    this.trackingPoints = [];
  }

  public addCollisionPoint(position: Vec, orientation: Quat) {
    const p = vec.toVector3(position);
    const o = quat.toQuaternion(orientation);
    this.collisionPoints.push(p);
    this.collisionOrientations.push(o);
    // this.addTrackingPoint(p);
  }

  public addTrackingPoint(position: Vec, state: BallState) {
    if (state !== BallState.Pocketed) {
      this.trackingPoints.push({ position: vec.toVector3(position), state });
    }
  }

  public updateImpactArrow(position: Vec, velocity: Vec) {
    this.impactArrow.position.copy(
      vec.toVector3(vec.sub(position, this.physics.position))
    );
    this.impactVelocity = vec.toVector3(velocity);
  }

  public clearImpactArrow() {
    this.impactVelocity = undefined;
  }

  public sync() {
    this.updateMesh();
    this.updateDebug();
  }

  private updateMesh() {
    this.mesh.rotation.setFromQuaternion(
      quat.toQuaternion(this.physics.orientation)
    );
    this.parent.position.copy(this.position);
  }

  public updateProjection() {
    const thisPosition = this.position;

    // ball collision projections
    this.projectionMeshes.forEach((mesh) => Game.remove(mesh));
    this.projectionMeshes = [];
    for (let i = 0; i < this.collisionPoints.length; i++) {
      const position = this.collisionPoints[i];
      const orientation = this.collisionOrientations[i];
      if (position.distanceToSquared(thisPosition) < 0.001) {
        continue;
      }

      const mesh = new Mesh(this.geometry, this.projectionMaterial);
      mesh.position.copy(position);
      mesh.rotation.setFromQuaternion(orientation);
      this.projectionMeshes.push(mesh);
    }
    this.projectionMeshes.forEach((mesh) => Game.add(mesh));

    // ball tracking line
    if (this.trackingLine) {
      Game.remove(this.trackingLine);
      this.trackingLine.geometry.dispose();
      this.trackingLine = undefined;
    }

    if (this.trackingPoints.length > 0) {
      this.trackingLine = createPathMesh(this.trackingPoints);
      Game.add(this.trackingLine);
    }

    // impact arrow
    if (this.impactVelocity) {
      this.impactArrow.setVector(this.impactVelocity);
    } else {
      this.impactArrow.visible = false;
    }
  }

  private updateDebug() {
    const { debugBalls } = settings;
    this.debugStateRing.visible = debugBalls;
    this.debugArrowCV.visible = debugBalls;
    this.debugArrowV.visible = debugBalls;
    this.debugArrowW.visible = debugBalls;

    if (!debugBalls) return;

    const state = this.physics.state;
    let color = 0x888888;
    if (state === BallState.Stationary) color = 0xffffff;
    else if (state === BallState.Sliding) color = 0xff0000;
    else if (state === BallState.Rolling) color = 0x00ffff;
    else if (state === BallState.Spinning) color = 0xff00ff;
    (this.debugStateRing.material as MeshBasicMaterial).color = new Color(
      color
    );
    this.debugStateRing.lookAt(Game.instance.camera.position);

    this.debugArrowCV.setVector(
      vec.toVector3(this.physics.getContactVelocity())
    );
    this.debugArrowV.setVector(vec.toVector3(this.physics.velocity));
    this.debugArrowW.setVector(vec.toVector3(this.physics.angularVelocity));
  }

  public dispose() {
    this.projectionMeshes.forEach((mesh) => Game.remove(mesh));
    if (this.trackingLine) {
      Game.remove(this.trackingLine);
      Game.dispose(this.trackingLine);
    }

    this.parent.traverse((obj) => Game.dispose(obj));
    Game.dispose(this.parent);
  }
}
