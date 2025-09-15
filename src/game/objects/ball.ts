import {
  ArrowHelper,
  BufferAttribute,
  BufferGeometry,
  Color,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Object3D,
  Quaternion,
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
import { vec } from '../physics/vec';
import { settings } from '../settings';
import { createMaterial } from '../rendering/create-material';

export class Ball {
  private physics: PhysicsBall;

  public number: number;
  private color: Color;

  // simulation
  private collisionPoints: Vector3[] = [];
  private collisionOrientations: Quaternion[] = [];
  private trackingPoints: Vector3[] = [];
  private original?: Ball;

  public parent!: Object3D;
  private mesh!: Mesh;

  private projectionMeshes: Mesh[] = [];
  private trackingLine?: Line;
  private geometry!: SphereGeometry;
  private projectionMaterial!: MeshPhysicalMaterial;
  private trackingLineMaterial!: LineBasicMaterial;

  private debugStateRing!: Mesh;
  private debugArrowCV!: ArrowHelper;
  private debugArrowV!: ArrowHelper;
  private debugArrowW!: ArrowHelper;

  constructor(
    x: number,
    y: number,
    color: Color,
    number: number = -1,
    original?: Ball
  ) {
    this.physics = original?.physics.clone(this) ?? new PhysicsBall(this, x, y);
    this.color = color;
    this.number = number;
    this.original = original;
    if (!original) {
      this.parent = new Object3D();
      this.parent.position.add(this.position);
      this.createMesh();
      this.createDebugMesh();

      this.updateMesh();
      this.updateDebug();
    }
  }

  private createMesh() {
    this.geometry = new SphereGeometry(this.physics.radius);
    const texture = createBallTexture({
      color: `#${this.color.getHexString()}`,
      number: this.number,
    });
    const material = createMaterial({
      map: texture,
      roughness: 0,
      metalness: 0,
    });
    // material.onBeforeCompile = (shader) => {
    //   console.log(shader.fragmentShader);
    // };
    this.mesh = new Mesh(this.geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.parent.add(this.mesh);
    this.projectionMaterial = createMaterial({
      map: texture,
      roughness: 0.1,
      metalness: 0,
      transparent: true,
      opacity: properties.projectionOpacity,
    });
    this.trackingLineMaterial = new LineBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: properties.projectionOpacity * 2,
    });
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

  public clone() {
    return new Ball(
      this.position.x,
      this.position.y,
      this.color,
      this.number,
      this
    );
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

  public collide(object: Ball | Cushion | Pocket): Collision | undefined {
    if (object instanceof Ball) {
      return this.collideBall(object);
    }
    if (object instanceof Cushion) {
      return this.collideCushion(object);
    }
    if (object instanceof Pocket) {
      return this.collidePocket(object);
    }
    return undefined;
  }

  public collideBall(ball: Ball) {
    return this.physics.collideBall(ball.physics);
  }

  public collideCushion(cushion: Cushion) {
    return this.physics.collideCushion(cushion.physics);
  }

  public collidePocket(pocket: Pocket, simulated = false) {
    return this.physics.collidePocket(pocket.physics, simulated);
  }

  public place(x: number, y: number) {
    this.physics.removeFromPocket();

    vec.mset(this.physics.position, x, y, 0);
    vec.mmult(this.physics.velocity, 0);
    vec.mmult(this.physics.angularVelocity, 0);
    this.physics.isStationary = true;

    this.updateMesh();
    this.updateDebug();
  }

  public clearCollisionPoints() {
    if (this.original) {
      this.original.clearCollisionPoints();
      return;
    }
    this.collisionPoints = [];
    this.collisionOrientations = [];
    this.trackingPoints = [];
  }

  public addCollisionPoint(position?: Vector3, orientation?: Quaternion) {
    position = (position ?? this.position).clone();
    orientation = (orientation ?? this.physics.orientation).clone();
    if (this.original) {
      this.original.addCollisionPoint(position, orientation);
      return;
    }
    this.collisionPoints.push(position);
    this.collisionOrientations.push(orientation);
    this.addTrackingPoint(position);
  }

  public addTrackingPoint(position?: Vector3) {
    if (!this.isPocketed) {
      position = (position ?? this.position).clone();
      if (this.original) {
        this.original.addTrackingPoint(position);
        return;
      }
      this.trackingPoints.push(position ?? this.position);
    }
  }

  public update(dt: number) {
    this.physics.update(dt);
    if (!this.original) {
      this.updateMesh();
      this.updateDebug();
    }
  }

  private updateMesh() {
    this.mesh.rotation.setFromQuaternion(this.physics.orientation);
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
      if (position.distanceToSquared(thisPosition) < 0.1) {
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

    const positions = new Float32Array(3 + this.trackingPoints.length * 3);
    positions[0] = thisPosition.x;
    positions[1] = thisPosition.y;
    positions[2] = thisPosition.z;
    for (let i = 0; i < this.trackingPoints.length; i++) {
      positions[(i + 1) * 3] = this.trackingPoints[i].x;
      positions[(i + 1) * 3 + 1] = this.trackingPoints[i].y;
      positions[(i + 1) * 3 + 2] = this.trackingPoints[i].z;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    this.trackingLine = new Line(geometry, this.trackingLineMaterial);
    Game.add(this.trackingLine);
  }

  private updateDebug() {
    const { debugBalls } = settings;
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

    const cv = vec.toVector3(this.physics.contactVelocity);
    this.debugArrowCV.setDirection(cv.clone().normalize());
    this.debugArrowCV.setLength(cv.length());

    const v = vec.toVector3(this.physics.velocity);
    this.debugArrowV.setDirection(v.clone().normalize());
    this.debugArrowV.setLength(v.length());

    const w = vec.toVector3(this.physics.angularVelocity);
    this.debugArrowW.setDirection(w.clone().normalize());
    this.debugArrowW.setLength(w.length());
  }
}
