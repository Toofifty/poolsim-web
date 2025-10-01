import {
  BufferGeometry,
  Color,
  Material,
  Mesh,
  Object3D,
  Quaternion,
  Vector3,
} from 'three';
import type { Line2 } from 'three/examples/jsm/Addons.js';
import { vec, type Quat, type Vec } from '../../../common/math';
import {
  BallState,
  PhysicsBall,
} from '../../../common/simulation/physics/ball';
import { properties } from '../../../common/simulation/physics/properties';
import type { Shot } from '../../../common/simulation/shot';
import { Game } from '../game';
import { createBallMesh } from '../models/ball/create-ball-mesh';
import {
  createPathMesh,
  type TrackingPoint,
} from '../models/ball/create-path-mesh';
import { createMaterial } from '../rendering/create-material';
import { toQuaternion, toVector3 } from '../util/three-interop';
import { Arrow } from './arrow';
import { BallDebug } from './ball-debug';
import { BallHighlight } from './ball-highlight';

export type BallProto = {
  id: number;
  number: number;
  color: number;
  position: Vec;
  orientation: Quat;
};

const INVALID_PROJECTION_MATERIAL = createMaterial({
  color: 0xff0000,
  transparent: true,
  opacity: properties.projectionOpacity,
});

export class Ball {
  public physics: PhysicsBall;

  public number: number;
  public color: Color;

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

  public highlight: BallHighlight;
  private debug: BallDebug;

  constructor({ id, number, color, position, orientation }: BallProto) {
    this.physics = new PhysicsBall(id, position, orientation);
    this.color = new Color(color);
    this.number = number;
    this.parent = new Object3D();
    this.parent.position.add(this.position);
    this.highlight = new BallHighlight(this);
    this.highlight.update();
    this.debug = new BallDebug(this);
    this.debug.update();
    this.parent.add(this.highlight, this.debug);

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
    return toVector3(this.physics.position);
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
    const p = toVector3(position);
    const o = toQuaternion(orientation);
    this.collisionPoints.push(p);
    this.collisionOrientations.push(o);
  }

  public addTrackingPoint(position: Vec, state: BallState) {
    this.trackingPoints.push({ position: toVector3(position), state });
  }

  public updateImpactArrow(position: Vec, velocity: Vec) {
    this.impactArrow.position.copy(
      toVector3(vec.sub(position, this.physics.position))
    );
    this.impactVelocity = toVector3(velocity);
  }

  public clearImpactArrow() {
    this.impactVelocity = undefined;
  }

  public sync() {
    this.updateMesh();
    this.highlight.update();
    this.debug.update();
  }

  private updateMesh() {
    this.mesh.rotation.setFromQuaternion(
      toQuaternion(this.physics.orientation)
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

    this.highlight.dispose();
    this.debug.dispose();

    this.parent.traverse((obj) => Game.dispose(obj));
    Game.dispose(this.parent);
  }
}
