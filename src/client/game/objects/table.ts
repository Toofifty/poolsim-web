import {
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Vector3,
} from 'three';
import { properties } from '../../../common/simulation/physics/properties';
import { RuleSet, TableState } from '../../../common/simulation/table-state';
import { Game } from '../game';
import { createTableClothMesh } from '../models/table/create-table-cloth-mesh';
import { createTableRailDiamondsMesh } from '../models/table/create-table-rail-diamonds-mesh';
import { createTableRailMesh } from '../models/table/create-table-rail-mesh';
import { settings } from '../store/settings';
import { themed } from '../store/theme';
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

  constructor() {
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
      new Pocket(leftBound, topBound, -ballRadius, cr),
      new Pocket(rightBound, topBound, -ballRadius, cr),
      new Pocket(leftBound, bottomBound, -ballRadius, cr),
      new Pocket(rightBound, bottomBound, -ballRadius, cr),
      new Pocket(0, topBound - edgeOffset, -ballRadius, er),
      new Pocket(0, bottomBound + edgeOffset, -ballRadius, er)
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
      if (ball instanceof Ball) {
        if (ball.number === -1) {
          // cue ball
          this.cue.attachTo(ball);
        }
        this.balls.push(ball);
      }
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

  public update(dt: number, updateCue?: boolean) {
    // sync to physics position
    this.balls.forEach((ball) => ball.sync());

    if (this.settled && updateCue && !settings.lockCue) {
      this.cursorPosition = Game.getFirstMouseIntersection(this.plane);
      if (this.cursorPosition) {
        this.cue.setTarget(this.cursorPosition);
      }
    }
    this.cue.update(dt, this.settled);
  }
}
