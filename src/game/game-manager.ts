import { Color, Vector3 } from 'three';
import { Table } from './objects/table';
import { Ball } from './objects/ball';
import { Rack } from './rack';
import { Result, Simulation } from './simulation/simulation';
import { Game } from './game';
import { vec } from './physics/vec';
import { AimAssistMode, Players, settings } from './store/settings';
import { properties } from './physics/properties';
import { gameStore } from './store/game';
import { AI } from './ai';
import { delay } from './util/delay';
import { RuleSet } from './simulation/table-state';

export enum GameState {
  PlayerShoot,
  AIShoot,
  AIReady,
  PlayerInPlay,
  AIInPlay,
}

export class GameManager {
  public table: Table;
  public simulation: Simulation;
  public ai: AI;
  public state!: GameState;
  public ruleSet!: RuleSet;

  private aiIsThinking = false;

  constructor() {
    this.table = new Table();
    this.simulation = new Simulation(this.table);
    this.ai = new AI(this.simulation);

    this.setupCueBall();
    this.setup9Ball();
    this.startGame();
  }

  public setupCueBall() {
    this.table.add(new Ball(0, 0, new Color('#FFF')));
  }

  public placeCueBall() {
    this.table.state.cueBall.place(-properties.tableLength / 6, 0);
  }

  public setup8Ball() {
    this.placeCueBall();
    this.table.clearTargetBalls();
    this.table.add(...Rack.generate8Ball(properties.tableLength / 6, 0));
    this.ruleSet = RuleSet._8Ball;
    this.table.state.ruleSet = RuleSet._8Ball;
  }

  public setup9Ball() {
    this.placeCueBall();
    this.table.clearTargetBalls();
    this.table.add(...Rack.generate9Ball(properties.tableLength / 6, 0));
    this.ruleSet = RuleSet._9Ball;
    this.table.state.ruleSet = RuleSet._9Ball;
  }

  public setupDebugGame() {
    this.placeCueBall();
    this.table.clearTargetBalls();
    this.table.add(...Rack.generateDebugGame(properties.tableLength / 6, 0));
    this.ruleSet = RuleSet._9Ball;
    this.table.state.ruleSet = RuleSet._8Ball;
  }

  public startGame() {
    this.simulation.reset();
    if (settings.players === Players.AIVsAI) {
      this.setState(GameState.AIShoot);
    } else if (settings.players === Players.PlayerVsPlayer) {
      this.setState(GameState.PlayerShoot);
    } else {
      this.setState(
        Math.random() > 0.5 ? GameState.PlayerShoot : GameState.AIShoot
      );
    }
  }

  public mousedown(event: MouseEvent) {
    if (event.button === 0 && this.state === GameState.PlayerShoot) {
      this.table.cue.shoot(() => {
        this.setState(GameState.PlayerInPlay);
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

  private shouldSwitchTurn(result?: Result) {
    result ??= this.simulation.getResult();
    return false;
  }

  private async playAIShot() {
    if (this.aiIsThinking) {
      return;
    }
    this.aiIsThinking = true;
    await delay(100);
    const shot = this.ai.findShot();
    if (!shot) return;
    // let dt catch up before animating the cue
    await delay(100);

    // const oldShot = this.table.cue.getShot();
    this.table.cue.setShot(shot);
    await delay(500);
    this.table.cue.shoot(async () => {
      this.setState(GameState.AIInPlay);
      await delay(500);
      // this.table.cue.setShot(oldShot);
      this.aiIsThinking = false;
    });
  }

  private setState(state: GameState) {
    this.state = state;
    gameStore.state = state;
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
        if (settings.players === Players.PlayerVsPlayer) {
          this.setState(GameState.PlayerShoot);
        } else {
          this.setState(
            this.shouldSwitchTurn() ? GameState.AIShoot : GameState.PlayerShoot
          );
        }
        this.simulation.reset();
        break;
      case GameState.AIInPlay:
        if (settings.players === Players.AIVsAI) {
          this.setState(GameState.AIShoot);
        } else {
          this.setState(
            this.shouldSwitchTurn() ? GameState.PlayerShoot : GameState.AIShoot
          );
        }
        this.simulation.reset();
        break;
      case GameState.AIShoot:
        this.playAIShot();
        break;
      default:
    }
  }

  public update(dt: number) {
    if (this.isInPlay) {
      const result = this.simulation.step(dt);
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

    if (
      this.state === GameState.PlayerShoot &&
      !this.table.cue.isShooting &&
      settings.aimAssistMode === AimAssistMode.Full
    ) {
      this.simulation.updateAimAssist(this.table.cue.getShot());
    } else {
      this.simulation.clearAimAssist();
    }
    this.table.state.balls.forEach((ball) => ball.updateProjection());

    this.updateState();
    this.table.update(dt, this.state === GameState.PlayerShoot, !this.isInPlay);
  }
}
