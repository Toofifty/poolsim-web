import {
  Mesh,
  MeshLambertMaterial,
  Object3D,
  PlaneGeometry,
  Vector3,
} from 'three';
import { Ball } from './ball';
import { properties } from '../physics/properties';
import { Cue } from './cue';
import { Game } from '../game';
import { Cushion } from './cushion';
import type { Collision } from '../physics/collision';

export class Table {
  public cue: Cue;
  public balls: Ball[];
  public cushions: Cushion[];

  private object3D: Object3D;
  private cloth!: Mesh;

  private cursorPosition?: Vector3;

  constructor() {
    this.object3D = new Object3D();
    this.cue = new Cue();
    this.object3D.add(this.cue.anchor);
    this.balls = [];
    this.cushions = [];
    this.createMeshes();
    this.createCushions();
  }

  private createMeshes() {
    this.cloth = new Mesh(
      new PlaneGeometry(properties.tableLength, properties.tableWidth),
      new MeshLambertMaterial({ color: '#227722' })
    );
    this.cloth.receiveShadow = true;
    this.cloth.position.z = -properties.ballRadius;
    this.object3D.add(this.cloth);
  }

  private createCushions() {
    const {
      tableLength,
      tableWidth,
      pocketCornerRadius,
      pocketEdgeRadius,
      pocketOverlap,
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
        topBound + pocketCornerRadius - pocketOverlap,
        bumperWidth,
        (bumperWidth * 3) / 2,
        0,
        vBumperHeight - bumperWidth * 3,
        -bumperWidth,
        (bumperWidth * 3) / 2 + pocketOverlap * 2
      ),
      // right
      Cushion.fromRelativeVertices2D(
        rightBound,
        topBound + pocketCornerRadius - pocketOverlap,
        -bumperWidth,
        (bumperWidth * 3) / 2,
        0,
        vBumperHeight - bumperWidth * 3,
        bumperWidth,
        (bumperWidth * 3) / 2 + pocketOverlap * 2
      ),
      // top-left
      Cushion.fromRelativeVertices2D(
        leftBound + pocketCornerRadius - pocketOverlap,
        topBound,
        hBumperWidth + pocketOverlap * 2,
        0,
        -bumperWidth / 2,
        bumperWidth,
        -hBumperWidth + bumperWidth * 2 - pocketOverlap,
        0
      ),
      // top-right
      Cushion.fromRelativeVertices2D(
        rightBound - pocketCornerRadius + pocketOverlap,
        topBound,
        -hBumperWidth - pocketOverlap * 2,
        0,
        bumperWidth / 2,
        bumperWidth,
        hBumperWidth - bumperWidth * 2 + pocketOverlap,
        0
      ),
      // bottom-left
      Cushion.fromRelativeVertices2D(
        leftBound + pocketCornerRadius - pocketOverlap,
        bottomBound,
        hBumperWidth + pocketOverlap * 2,
        0,
        -bumperWidth / 2,
        -bumperWidth,
        -hBumperWidth + bumperWidth * 2 - pocketOverlap,
        0
      ),
      // bottom-right
      Cushion.fromRelativeVertices2D(
        rightBound - pocketCornerRadius + pocketOverlap,
        bottomBound,
        -hBumperWidth - pocketOverlap * 2,
        0,
        bumperWidth / 2,
        -bumperWidth,
        hBumperWidth - bumperWidth * 2 + pocketOverlap,
        0
      ),
    ];

    this.object3D.add(...this.cushions.map((cushion) => cushion.mesh));
  }

  public getObject() {
    return this.object3D;
  }

  public add(object: Ball) {
    this.object3D.add(object.getMesh());
    if (object instanceof Ball) {
      this.balls.push(object);
      // assume first ball is cue ball
      if (this.balls.length === 1) {
        this.cue.attachTo(object);
      }
    }
  }

  public mousedown(event: MouseEvent) {
    if (event.button === 0) {
      this.cue.shoot();
    }
  }

  public update() {
    this.cursorPosition = Game.getFirstMouseIntersection(this.cloth);
    if (this.cursorPosition) {
      this.cue.setTarget(this.cursorPosition);
    }
    this.cue.update();

    // todo: move to simulation
    this.balls.forEach((ball) => ball.update());
    const activeBalls = this.balls.filter((ball) => !ball.isPocketed);

    const collisions: Collision[] = [];
    activeBalls.forEach((ball, i) => {
      collisions.push(
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
        console.log(collision.impulse.length());
        Game.playAudio(
          'clack',
          collision.position,
          Math.min(collision.impulse.length() / 100, 1)
        );
      }
    });
  }
}
