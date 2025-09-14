import {
  Mesh,
  MeshLambertMaterial,
  Object3D,
  Shape,
  ShapeGeometry,
  Vector3,
} from 'three';
import { Ball } from './ball';
import { properties } from '../physics/properties';
import { Cue } from './cue';
import { Game } from '../game';
import { Cushion } from './cushion';
import type { Collision } from '../physics/collision';
import { Pocket } from './pocket';

export class Table {
  public cue: Cue;
  public cueBall!: Ball;
  public targetBalls: Ball[];
  public cushions: Cushion[];
  public pockets: Pocket[];

  public object3D: Object3D;
  private cloth!: Mesh;

  private cursorPosition?: Vector3;

  constructor() {
    this.object3D = new Object3D();
    this.cue = new Cue();
    this.object3D.add(this.cue.anchor);
    this.targetBalls = [];
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
    const {
      tableLength,
      tableWidth,
      pocketCornerRadius,
      pocketEdgeRadius,
      pocketOverlap,
      pocketCornerOverlap,
      bumperWidth,
    } = properties;

    const leftBound = -tableLength / 2;
    const rightBound = tableLength / 2;
    const topBound = -tableWidth / 2;
    const bottomBound = tableWidth / 2;

    const vBumperHeight = tableWidth - pocketCornerRadius * 2;
    const hBumperWidth =
      tableLength / 2 - pocketCornerRadius - pocketEdgeRadius;

    this.cushions = [
      // left
      Cushion.fromRelativeVertices2D(
        leftBound,
        topBound + pocketCornerRadius - pocketCornerOverlap,
        0,
        vBumperHeight + pocketCornerOverlap * 2,
        bumperWidth,
        -bumperWidth,
        0,
        -vBumperHeight + bumperWidth * 2 - pocketCornerOverlap * 2
      ).reverseVertices(),
      // right
      Cushion.fromRelativeVertices2D(
        rightBound,
        topBound + pocketCornerRadius - pocketCornerOverlap,
        0,
        vBumperHeight + pocketCornerOverlap * 2,
        -bumperWidth,
        -bumperWidth,
        0,
        -vBumperHeight + bumperWidth * 2 - pocketCornerOverlap * 2
      ),
      // top-left
      Cushion.fromRelativeVertices2D(
        leftBound + pocketCornerRadius - pocketCornerOverlap,
        bottomBound,
        hBumperWidth + pocketOverlap + pocketCornerOverlap,
        0,
        -bumperWidth / 2,
        -bumperWidth,
        -hBumperWidth +
          (bumperWidth * 3) / 2 -
          pocketOverlap -
          pocketCornerOverlap,
        0
      ).reverseVertices(),
      // top-right
      Cushion.fromRelativeVertices2D(
        rightBound - pocketCornerRadius + pocketCornerOverlap,
        bottomBound,
        -hBumperWidth - pocketOverlap - pocketCornerOverlap,
        0,
        bumperWidth / 2,
        -bumperWidth,
        hBumperWidth -
          (bumperWidth * 3) / 2 +
          pocketOverlap +
          pocketCornerOverlap,
        0
      ),
      // bottom-left
      Cushion.fromRelativeVertices2D(
        leftBound + pocketCornerRadius - pocketCornerOverlap,
        topBound,
        hBumperWidth + pocketOverlap + pocketCornerOverlap,
        0,
        -bumperWidth / 2,
        bumperWidth,
        -hBumperWidth +
          (bumperWidth * 3) / 2 -
          pocketOverlap -
          pocketCornerOverlap,
        0
      ),
      // bottom-right
      Cushion.fromRelativeVertices2D(
        rightBound - pocketCornerRadius + pocketCornerOverlap,
        topBound,
        -hBumperWidth - pocketOverlap - pocketCornerOverlap,
        0,
        bumperWidth / 2,
        bumperWidth,
        hBumperWidth -
          (bumperWidth * 3) / 2 +
          pocketOverlap +
          pocketCornerOverlap,
        0
      ).reverseVertices(),
    ];

    this.object3D.add(...this.cushions.map((cushion) => cushion.mesh));
  }

  public add(...objects: Ball[]) {
    objects.forEach((object) => {
      this.object3D.add(object.parent);
      if (object instanceof Ball) {
        if (object.number === -1) {
          this.cueBall = object;
          this.cue.attachTo(object);
          return;
        }
        this.targetBalls.push(object);
      }
    });
  }

  public clearTargetBalls() {
    this.targetBalls.forEach((ball) => {
      this.object3D.remove(ball.parent);
    });
    this.targetBalls = [];
  }

  public get balls() {
    if (!this.cueBall) {
      throw new Error('No cue ball found');
    }
    return [this.cueBall, ...this.targetBalls];
  }

  public get settled() {
    return this.balls.every(
      (ball) => ball.isStationary || (ball.isPocketed && ball.number > 0)
    );
  }

  public update() {
    if (this.settled) {
      this.cursorPosition = Game.getFirstMouseIntersection(this.cloth);
      if (this.cursorPosition) {
        this.cue.setTarget(this.cursorPosition);
      }
      this.cue.update();
    }

    // todo: move to simulation
    this.balls.forEach((ball) => ball.update());

    // collide balls in pockets
    this.pockets.forEach((pocket) => {
      pocket.physics.balls.forEach((ball, i) => {
        this.cushions.map((cushion) => ball.collideCushion(cushion.physics)),
          ball.collidePocket(pocket.physics);
        pocket.physics.balls.slice(i).map((other) => ball.collideBall(other));
      });
    });

    const collisions: Collision[] = [];
    const activeBalls = this.balls.filter((ball) => !ball.isPocketed);

    activeBalls.forEach((ball, i) => {
      collisions.push(
        ...this.pockets
          .map((pocket) => ball.collide(pocket))
          .filter((v) => v !== undefined),
        ...this.cushions
          .map((cushion) => ball.collide(cushion))
          .filter((v) => v !== undefined),
        ...activeBalls
          .slice(i)
          .map((other) => ball.collide(other))
          .filter((v) => v !== undefined)
      );
    });

    collisions.forEach((collision) => {
      if (collision.type === 'ball-ball') {
        Game.playAudio(
          'clack',
          collision.position,
          Math.min(collision.impulse.length() / 10, 10)
        );
      }
    });
  }
}
