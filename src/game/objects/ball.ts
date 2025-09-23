import {
  BufferGeometry,
  Color,
  Material,
  Mesh,
  Object3D,
  Quaternion,
  Vector3,
} from 'three';
import { BallState, PhysicsBall } from '../physics/ball';
import type { Shot } from '../physics/shot';
import { Game } from '../game';
import { createBallMesh } from '../models/ball/create-ball-mesh';
import { Arrow } from './arrow';
import {
  createPathMesh,
  type TrackingPoint,
} from '../models/ball/create-path-mesh';
import type { Line2 } from 'three/examples/jsm/Addons.js';
import { quat, vec, type Quat, type Vec } from '../physics/math';
import { BallDebug } from './ball-debug';
import { createMaterial } from '../rendering/create-material';
import { properties } from '../physics/properties';

const INVALID_PROJECTION_MATERIAL = createMaterial({
  color: 0xff0000,
  transparent: true,
  opacity: properties.projectionOpacity,
});

export class Ball {
  public physics: PhysicsBall;

  public number: number;
  private color: Color;

  // simulation
  private collisionPoints: Vector3[] = [];
  private collisionOrientations: Quaternion[] = [];
  private trackingPoints: TrackingPoint[] = [];
  /** Signifies the final collision is invalid */
  public invalidCollision = false;
  private impactVelocity?: Vector3;

  public parent!: Object3D;
  private mesh!: Mesh;

  private projectionMeshes: Mesh[] = [];
  private trackingLine?: Line2;
  private geometry!: BufferGeometry;
  private projectionMaterial!: Material;
  private impactArrow!: Arrow;

  private debug: BallDebug;

  constructor(x: number, y: number, color: Color, number: number = -1) {
    this.physics = new PhysicsBall(number, x, y);
    this.color = color;
    this.number = number;
    this.parent = new Object3D();
    this.parent.position.add(this.position);
    this.debug = new BallDebug(this);
    this.debug.update();
    this.parent.add(this.debug);

    this.createMesh();
    this.updateMesh();
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

  get id() {
    return this.physics.id;
  }

  get position() {
    return vec.toVector3(this.physics.position);
  }

  get radius() {
    return this.physics.radius;
  }

  get state() {
    return this.physics.state;
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
    this.debug.update();
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
  }

  public addTrackingPoint(position: Vec, state: BallState) {
    this.trackingPoints.push({ position: vec.toVector3(position), state });
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
    this.debug.update();
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

      const material =
        this.invalidCollision && i === this.collisionPoints.length - 1
          ? INVALID_PROJECTION_MATERIAL
          : this.projectionMaterial;

      const mesh = new Mesh(this.geometry, material);
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
    if (this.impactVelocity && !this.invalidCollision) {
      this.impactArrow.setVector(this.impactVelocity);
    } else {
      this.impactArrow.visible = false;
    }
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
