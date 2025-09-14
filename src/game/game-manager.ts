import { Color } from 'three';
import { Table } from './objects/table';
import { Ball } from './objects/ball';
import { Rack } from './rack';

export enum GameState {
  PlayerShoot,
  AIShoot,
  AIReady,
  PlayerInPlay,
  AIInPlay,
}

export enum GameMode {
  _8Ball,
  _9Ball,
}

export class GameManager {
  public table: Table;
  public state!: GameState;
  public mode!: GameMode;

  constructor() {
    this.table = new Table();

    this.setupCueBall();
    this.setup8Ball();
    this.startGame();
  }

  public setupCueBall() {
    this.table.add(new Ball(0, 0, new Color('#FFF')));
  }

  public placeCueBall() {
    this.table.cueBall.place(-40, 0);
  }

  public setup8Ball() {
    this.placeCueBall();
    this.table.clearTargetBalls();
    this.table.add(...Rack.generate8Ball(40, 0));
    this.mode = GameMode._8Ball;
  }

  public setup9Ball() {
    this.placeCueBall();
    this.table.clearTargetBalls();
    this.table.add(...Rack.generate9Ball(40, 0));
    this.mode = GameMode._9Ball;
  }

  public startGame() {
    this.state = GameState.PlayerShoot;
  }

  public mousedown(event: MouseEvent) {
    if (event.button === 0 && this.state === GameState.PlayerShoot) {
      this.table.cue.shoot();
      this.state = GameState.PlayerInPlay;
    }
  }

  private updateState() {
    if (!this.table.settled) {
      return;
    }

    if (this.table.cueBall.isPocketed) {
      this.placeCueBall();
    }

    switch (this.state) {
      case GameState.PlayerInPlay:
        this.state = GameState.PlayerShoot;
        break;
      case GameState.AIInPlay:
        this.state = GameState.AIShoot;
        break;
      default:
    }
  }

  public update() {
    this.updateState();
    this.table.update();
  }
}
