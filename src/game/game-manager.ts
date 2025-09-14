import { Color } from 'three';
import { Table } from './objects/table';
import { Ball } from './objects/ball';
import { Rack } from './rack';
import { Simulation } from './simulation/simulation';
import { Game } from './game';
import { vec } from './physics/vec';

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
  public simulation: Simulation;
  public state!: GameState;
  public mode!: GameMode;

  constructor() {
    this.table = new Table();
    this.simulation = new Simulation(this.table);

    this.setupCueBall();
    this.setup9Ball();
    this.startGame();
  }

  public setupCueBall() {
    this.table.add(new Ball(0, 0, new Color('#FFF')));
  }

  public placeCueBall() {
    this.table.state.cueBall.place(-40, 0);
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

  public setupDebugGame() {
    this.placeCueBall();
    this.table.clearTargetBalls();
    this.table.add(...Rack.generateDebugGame(40, 0));
    this.mode = GameMode._9Ball;
  }

  public startGame() {
    this.state = GameState.PlayerShoot;
  }

  public mousedown(event: MouseEvent) {
    if (event.button === 0 && this.state === GameState.PlayerShoot) {
      this.table.cue.shoot(() => {
        this.state = GameState.PlayerInPlay;
      });
    }
  }

  public keyup(event: KeyboardEvent) {
    if (event.key === 's') {
      this.simulation.updateAimAssist(this.table.cue.getShot());
    } else {
      console.log(event.key);
    }
  }

  get isInPlay() {
    return (
      this.state === GameState.AIInPlay || this.state === GameState.PlayerInPlay
    );
  }

  private updateState() {
    if (!this.table.settled) {
      return;
    }

    if (this.table.state.cueBall.isPocketed) {
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
    if (this.isInPlay) {
      const result = this.simulation.step();
      result.collisions.forEach((collision) => {
        if (collision.type === 'ball-ball') {
          Game.playAudio(
            'clack',
            vec.toVector3(collision.position),
            Math.min(vec.len(collision.impulse) / 10, 10)
          );
        }
      });
    }

    if (this.state === GameState.PlayerShoot && !this.table.cue.isShooting) {
      this.simulation.updateAimAssist(this.table.cue.getShot());
    } else {
      this.simulation.clearAimAssist();
    }
    this.table.state.balls.forEach((ball) => ball.updateProjection());

    this.updateState();
    this.table.update(!this.isInPlay);
  }
}
