import {
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Vector3,
} from 'three';
import { vec } from '../../../common/math';
import { properties } from '../../../common/simulation/physics/properties';
import { RuleSet, TableState } from '../../../common/simulation/table-state';
import { Game } from '../game';
import { createTableClothMesh } from '../models/table/create-table-cloth-mesh';
import { createTableRailDiamondsMesh } from '../models/table/create-table-rail-diamonds-mesh';
import { createTableRailMesh } from '../models/table/create-table-rail-mesh';
import type { INetwork } from '../network';
import { settings } from '../store/settings';
import { themed } from '../store/theme';
import { toVec } from '../util/three-interop';
import { Ball } from './ball';
import { Cue } from './cue';
import { createCushions, Cushion } from './cushion';
import { Pocket } from './pocket';

export class Table {
  public cue: Cue;
  public balls: Ball[];
  public state: TableState;
  public cushions: Cushion[];
  public pockets: Pocket[];

  public object3D: Object3D;
  private cloth!: Mesh;
  private rail!: Mesh;
  private diamonds!: Mesh;
  private plane!: Mesh;

  private cursorPosition?: Vector3;

  public ballInHand?: Ball;

  constructor(private network: INetwork) {
    this.object3D = new Object3D();
    this.cue = new Cue();
    this.object3D.add(this.cue.anchor);
    this.balls = [];
    this.cushions = [];
    this.pockets = [];
    this.createCushions();
    this.createPockets();
    this.createMeshes();
    this.state = new TableState(
      this.balls.map((b) => b.physics),
      this.cushions.map((c) => c.physics),
      this.pockets.map((p) => p.physics),
      RuleSet._9Ball
    );
  }

  private createMeshes() {
    themed((theme) => {
      if (this.cloth) {
        Game.dispose(this.cloth);
        this.object3D.remove(this.cloth);
      }

      this.cloth = createTableClothMesh(this.pockets, theme);
      this.object3D.add(this.cloth);

      if (this.rail) {
        Game.dispose(this.rail);
        this.object3D.remove(this.rail);
      }

      this.rail = createTableRailMesh(this.pockets, theme);
      this.object3D.add(this.rail);

      if (this.diamonds) {
        Game.dispose(this.diamonds);
        this.object3D.remove(this.diamonds);
      }

      this.diamonds = createTableRailDiamondsMesh(theme);
      this.object3D.add(this.diamonds);
    });

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
      new Pocket(0, leftBound, topBound, -ballRadius, cr),
      new Pocket(1, rightBound, topBound, -ballRadius, cr),
      new Pocket(2, leftBound, bottomBound, -ballRadius, cr),
      new Pocket(3, rightBound, bottomBound, -ballRadius, cr),
      new Pocket(4, 0, topBound - edgeOffset, -ballRadius, er),
      new Pocket(5, 0, bottomBound + edgeOffset, -ballRadius, er)
    );

    this.object3D.add(...this.pockets.map((pocket) => pocket.parent));
  }

  private createCushions() {
    this.cushions = createCushions();
    this.object3D.add(...this.cushions);
  }

  public addBalls(...balls: Ball[]) {
    balls.forEach((ball) => {
      this.object3D.add(ball.parent);
      if (ball.number === 0) {
        // cue ball
        this.cue.attachTo(ball);
      }
      this.balls.push(ball);
    });
    this.state.balls = this.balls.map((b) => b.physics);
  }

  public get cueBall() {
    return this.balls[0];
  }

  public clearBalls() {
    this.balls.forEach((ball) => {
      this.object3D.remove(ball.parent);
      ball.dispose();
    });
    this.balls = [];
    this.state.balls = [];
  }

  public get settled() {
    return this.state.settled;
  }

  public onMouseDown(event: MouseEvent) {
    if (this.ballInHand && (event.button === 0 || event.button === 2)) {
      vec.msetZ(this.ballInHand.physics.position, 0);
      this.ballInHand = undefined;
      this.network.placeBallInHand();
      return;
    }

    if (event.button === 2 && settings.enableBallPickup && this.settled) {
      const intersect = Game.getFirstMouseIntersection(this.plane);
      if (!intersect) return;
      const position = toVec(intersect);

      let closest: Ball | undefined;
      let closestDist = Infinity;

      for (const ball of this.balls) {
        const dist = vec.dist(position, ball.physics.position);
        if (dist < closestDist) {
          closest = ball;
          closestDist = dist;
        }
      }
      if (closest?.isStationary) {
        this.ballInHand = closest;
      }
    }
  }

  public putBallInHand() {
    this.ballInHand = this.cueBall;
  }

  public update(dt: number, isCurrentTurn?: boolean) {
    // sync to physics position
    this.balls.forEach((ball) => ball.sync());

    if (this.ballInHand && isCurrentTurn) {
      this.moveBallInHand(this.ballInHand);
      this.network.syncSingleBall(this.ballInHand.physics.serialize());
      return;
    }

    if (this.settled && isCurrentTurn && !settings.lockCue) {
      this.cursorPosition = Game.getFirstMouseIntersection(this.plane);
      if (this.cursorPosition) {
        this.cue.setTarget(this.cursorPosition);
        this.network.syncCue(this.cue.serialize());
      }
    }
    this.cue.update(dt, this.settled);
  }

  private moveBallInHand(ball: Ball) {
    const intersect = Game.getFirstMouseIntersection(this.plane);
    if (!intersect) return;
    const position = vec.setZ(toVec(intersect), 0);

    const collidingBall = this.balls.some(
      (b) =>
        b !== ball &&
        vec.dist(position, vec.setZ(b.physics.r, 0)) <
          ball.physics.radius + b.physics.radius
    );
    const collidingCushion = this.state.cushions.some((cushion) => {
      const closestPoint = cushion.findClosestPoint(position);
      return (
        vec.dist(vec.setZ(closestPoint, 0), position) < ball.physics.radius
      );
    });
    const collidingPocket = this.state.pockets.some(
      (pocket) =>
        vec.dist(vec.setZ(pocket.position, 0), position) < pocket.radius
    );
    const outOfBounds =
      position[0] < -properties.tableLength / 2 ||
      position[0] > properties.tableLength / 2 ||
      position[1] < -properties.tableWidth / 2 ||
      position[1] > properties.tableWidth / 2;

    if (
      !collidingBall &&
      !collidingCushion &&
      !collidingPocket &&
      !outOfBounds
    ) {
      vec.mcopy(ball.physics.position, position);
    }
    vec.msetZ(ball.physics.position, 0.1);
  }
}
