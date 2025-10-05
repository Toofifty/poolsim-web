import { BufferGeometry, Color, Material, Mesh, Object3D } from 'three';
import { vec, type Quat, type Vec } from '../../../common/math';
import { defaultParams, type Params } from '../../../common/simulation/physics';
import {
  PhysicsBall,
  type PhysicsBallSnapshot,
} from '../../../common/simulation/physics/ball';
import type { Shot } from '../../../common/simulation/shot';
import { Game } from '../game';
import { createBallMesh } from '../models/ball/create-ball-mesh';
import {
  createPathMesh,
  type TrackingPoint,
} from '../models/ball/create-path-mesh';
import { createMaterial } from '../rendering/create-material';
import { makeTheme } from '../store/theme';
import { snapshot } from '../util/subscribe';
import { toQuaternion, toVector3 } from '../util/three-interop';
import { Arrow } from './arrow';
import { BallDebug } from './ball-debug';
import { BallHighlight } from './ball-highlight';
import { BallFirstContact } from './util/ball-first-contact';

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
  opacity: defaultParams.ball.projectionOpacity,
});

export class Ball {
  public physics: PhysicsBall;

  public number: number;
  public color: Color;

  // simulation
  private collisionPoints: Vec[] = [];
  private collisionOrientations: Quat[] = [];
  private trackingPoints: TrackingPoint[] = [];
  /** Signifies the final collision is invalid */
  public invalidCollision = false;

  public parent!: Object3D;
  private mesh!: Mesh;

  private projectionMeshes: Mesh[] = [];
  private trackingLine?: Object3D;
  private geometry!: BufferGeometry;
  private projectionMaterial!: Material;

  private impactArrow!: Arrow;
  private firstContact?: BallFirstContact;

  public highlight: BallHighlight;
  private debug: BallDebug;

  constructor(
    private params: Params,
    { id, number, color, position, orientation }: BallProto
  ) {
    this.physics = new PhysicsBall(snapshot(params), id, position, orientation);
    this.color = new Color(color);
    this.number = number;
    this.parent = new Object3D();
    this.parent.position.add(this.position);
    this.highlight = new BallHighlight(this);
    this.highlight.update();
    this.debug = new BallDebug(this);
    this.debug.update();

    if (id === 0) {
      this.firstContact = new BallFirstContact(this);
    }

    this.createMesh();
    this.updateMesh();
  }

  private createMesh() {
    const { mesh, projectionMaterial } = createBallMesh(
      this.params,
      makeTheme(),
      {
        color: this.color,
        number: this.number,
      }
    );
    this.mesh = mesh;
    Game.reflectives.push(this.mesh);
    this.geometry = this.mesh.geometry;
    this.projectionMaterial = projectionMaterial;

    this.parent.add(this.mesh);
    this.impactArrow = new Arrow(this, {
      color: this.color,
      factor: 0.2,
    });
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
    this.physics.place(x, y);
    this.updateMesh();
    this.debug.update();
  }

  public clearCollisionPoints() {
    this.collisionPoints = [];
    this.collisionOrientations = [];
    this.trackingPoints = [];
  }

  public addCollisionPoint(position: Vec, orientation: Quat) {
    const lastCollisionPoint = this.collisionPoints.at(-1);
    if (
      (!lastCollisionPoint || !vec.eq(lastCollisionPoint, position, 1e-3)) &&
      !vec.eq(this.physics.position, position, 1e-3)
    ) {
      this.collisionPoints.push(position);
      this.collisionOrientations.push(orientation);
    }
  }

  public addTrackingPoints(points: PhysicsBallSnapshot[]) {
    this.trackingPoints.push(
      ...points.map((point) => ({
        position: toVector3(point.position),
        state: point.state,
      }))
    );
  }

  public updateImpactArrow(position: Vec, velocity: Vec) {
    this.impactArrow.ref = {
      position: toVector3(position),
    };
    this.impactArrow.setVector(toVector3(velocity));
  }

  public clearImpactArrow() {
    this.impactArrow.visible = false;
  }

  public sync() {
    this.updateMesh();
    this.firstContact?.update();
    this.highlight.update();
    this.impactArrow.update();
    this.debug.update();
  }

  private updateMesh() {
    this.mesh.rotation.setFromQuaternion(
      toQuaternion(this.physics.orientation)
    );
    this.parent.position.copy(this.position);
  }

  public updateProjection() {
    // ball collision projections
    this.projectionMeshes.forEach((mesh) => Game.remove(mesh));
    this.projectionMeshes = [];
    if (this.firstContact) {
      this.firstContact.visible = false;
    }

    if (this.firstContact && this.collisionPoints.length === 1) {
      // first contact ring
      const point = this.collisionPoints[0];
      this.firstContact.setPosition(point);
      this.firstContact.setInvalid(this.invalidCollision);
      this.firstContact.visible = true;
    } else {
      for (let i = 0; i < this.collisionPoints.length; i++) {
        const position = this.collisionPoints[i];
        const orientation = this.collisionOrientations[i];
        const material =
          this.invalidCollision &&
          this.id === 0 &&
          i === this.collisionPoints.length - 1
            ? INVALID_PROJECTION_MATERIAL
            : this.projectionMaterial;

        const mesh = new Mesh(this.geometry, material);
        mesh.position.copy(toVector3(position));
        mesh.rotation.setFromQuaternion(toQuaternion(orientation));
        this.projectionMeshes.push(mesh);
        this.projectionMeshes.forEach((mesh) => Game.add(mesh));
      }
    }

    // ball tracking line
    if (this.trackingLine) {
      Game.remove(this.trackingLine);
      (this.trackingLine as any).geometry.dispose();
      this.trackingLine = undefined;
    }

    if (this.trackingPoints.length > 1) {
      this.trackingLine = createPathMesh(this.trackingPoints, this.color);
      Game.add(this.trackingLine, { outline: true });
    }
  }

  public dispose() {
    this.projectionMeshes.forEach((mesh) => Game.remove(mesh));
    if (this.trackingLine) {
      Game.remove(this.trackingLine);
      Game.dispose(this.trackingLine);
    }

    this.firstContact?.dispose();
    this.impactArrow.dispose();
    this.highlight.dispose();
    this.debug.dispose();

    this.parent.traverse((obj) => Game.dispose(obj));
    Game.dispose(this.parent);
  }
}
