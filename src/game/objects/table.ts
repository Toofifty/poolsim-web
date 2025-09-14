import {
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  Vector3,
} from 'three';
import { Ball } from './ball';
import { properties } from '../physics/properties';
import { Cue } from './cue';
import { Game } from '../game';
import { createCushions, Cushion } from './cushion';
import { Pocket } from './pocket';
import { TableState } from '../simulation/table-state';

export class Table {
  public cue: Cue;
  public state: TableState;
  public cushions: Cushion[];
  public pockets: Pocket[];

  public object3D: Object3D;
  private cloth!: Mesh;
  private plane!: Mesh;

  private cursorPosition?: Vector3;

  constructor() {
    this.object3D = new Object3D();
    this.cue = new Cue();
    this.object3D.add(this.cue.anchor);
    this.state = new TableState();
    this.cushions = [];
    this.pockets = [];
    this.createCushions();
    this.createPockets();
    this.createMeshes();
  }

  private createMeshes() {
    const l = properties.tableLength + properties.pocketCornerRadius * 2;
    const w = properties.tableWidth + properties.pocketCornerRadius * 2;
    const shape = new Shape();
    shape.moveTo(-l / 2, -w / 2);
    shape.lineTo(l / 2, -w / 2);
    shape.lineTo(l / 2, w / 2);
    shape.lineTo(-l / 2, w / 2);
    shape.lineTo(-l / 2, -w / 2);
    this.pockets.forEach((pocket) => {
      const hole = new Shape();
      hole.absarc(
        pocket.position.x,
        pocket.position.y,
        pocket.radius,
        0,
        Math.PI * 2,
        false
      );
      shape.holes.push(hole);
    });
    const geometry = new ShapeGeometry(shape);

    this.cloth = new Mesh(
      geometry,
      new MeshLambertMaterial({ color: '#227722' })
    );
    this.cloth.castShadow = true;
    this.cloth.receiveShadow = true;
    this.cloth.position.z = -properties.ballRadius;
    this.object3D.add(this.cloth);

    this.plane = new Mesh(
      new PlaneGeometry(properties.tableLength * 3, properties.tableWidth * 3),
      new MeshBasicMaterial({ color: '#fff' })
    );
    this.plane.visible = false;
    this.object3D.add(this.plane);
  }

  private createPockets() {
    const {
      tableLength,
      tableWidth,
      pocketCornerRadius: cr,
      pocketEdgeRadius: er,
      ballRadius,
    } = properties;

    const leftBound = -tableLength / 2;
    const rightBound = tableLength / 2;
    const topBound = -tableWidth / 2;
    const bottomBound = tableWidth / 2;

    const edgeOffset = cr - er;

    this.pockets.push(
      new Pocket(leftBound, topBound, -ballRadius, cr),
      new Pocket(rightBound, topBound, -ballRadius, cr),
      new Pocket(leftBound, bottomBound, -ballRadius, cr),
      new Pocket(rightBound, bottomBound, -ballRadius, cr),
      new Pocket(0, topBound - edgeOffset, -ballRadius, er),
      new Pocket(0, bottomBound + edgeOffset, -ballRadius, er)
    );

    this.object3D.add(...this.pockets.map((pocket) => pocket.mesh));
  }

  private createCushions() {
    this.cushions = createCushions();
    this.object3D.add(...this.cushions.map((cushion) => cushion.mesh));
  }

  public add(...objects: Ball[]) {
    objects.forEach((object) => {
      this.object3D.add(object.parent);
      if (object instanceof Ball) {
        if (object.number === -1) {
          this.state.cueBall = object;
          this.cue.attachTo(object);
          return;
        }
        this.state.targetBalls.push(object);
      }
    });
  }

  public clearTargetBalls() {
    this.state.targetBalls.forEach((ball) => {
      this.object3D.remove(ball.parent);
    });
    this.state.targetBalls = [];
  }

  public get balls() {
    return this.state.balls;
  }

  public get settled() {
    return this.balls.every(
      (ball) => ball.isStationary || (ball.isPocketed && ball.number > 0)
    );
  }

  public update() {
    if (this.settled) {
      this.cursorPosition = Game.getFirstMouseIntersection(this.plane);
      if (this.cursorPosition) {
        this.cue.setTarget(this.cursorPosition);
      }
      this.cue.update();
    }

    // collide balls in pockets
    // not needed in simulation
    this.pockets.forEach((pocket) => {
      pocket.physics.balls.forEach((ball, i) => {
        this.cushions.map((cushion) => ball.collideCushion(cushion.physics)),
          ball.collidePocket(pocket.physics);
        pocket.physics.balls.slice(i).map((other) => ball.collideBall(other));
      });
    });
  }
}
