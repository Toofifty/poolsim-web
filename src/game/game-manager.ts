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
import { AimAssist } from './simulation/aim-assist';

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

  private aimAssist: AimAssist;
  private currentSimulationResult!: Result;

  constructor() {
    this.table = new Table();
    this.simulation = new Simulation();
    this.ai = new AI();
    this.aimAssist = new AimAssist();

    this.resetSimulationResult();
    this.setupCueBall();
    this.setup9Ball();
    this.startGame();
  }

  private resetSimulationResult() {
    this.currentSimulationResult = new Result(undefined, this.table.state);
  }

  public setupCueBall() {
    this.table.add(new Ball(0, 0, properties.colorCueBall));
  }

  public placeCueBall() {
    if (!this.table.cueBall) {
      this.table.add(new Ball(0, 0, properties.colorCueBall));
    }
    this.table.cueBall.place(-properties.tableLength / 6, 0);
  }

  public setup8Ball() {
    this.table.clearBalls();
    this.placeCueBall();
    this.table.add(...Rack.generate8Ball(properties.tableLength / 6, 0));
    this.ruleSet = RuleSet._8Ball;
    this.table.state.ruleSet = RuleSet._8Ball;
    this.aimAssist.setBalls([...this.table.balls]);
  }

  public setup9Ball() {
    this.table.clearBalls();
    this.placeCueBall();
    this.table.add(...Rack.generate9Ball(properties.tableLength / 6, 0));
    this.ruleSet = RuleSet._9Ball;
    this.table.state.ruleSet = RuleSet._9Ball;
    this.aimAssist.setBalls([...this.table.balls]);
  }

  public setupDebugGame() {
    this.table.clearBalls();
    this.placeCueBall();
    this.table.add(...Rack.generateDebugGame(properties.tableLength / 6, 0));
    this.ruleSet = RuleSet._9Ball;
    this.table.state.ruleSet = RuleSet._8Ball;
    this.aimAssist.setBalls([...this.table.balls]);
  }

  public startGame() {
    this.resetSimulationResult();
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
      this.aimAssist.update(this.table.cue.getShot(), this.table.state);
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
    result ??= this.currentSimulationResult;
    // todo
    return false;
  }

  private async playAIShot() {
    if (this.aiIsThinking) {
      return;
    }
    this.aiIsThinking = true;
    await delay(100);
    const shot = this.ai.findShot(this.table.state);
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
        this.resetSimulationResult();
        break;
      case GameState.AIInPlay:
        if (settings.players === Players.AIVsAI) {
          this.setState(GameState.AIShoot);
        } else {
          this.setState(
            this.shouldSwitchTurn() ? GameState.PlayerShoot : GameState.AIShoot
          );
        }
        this.resetSimulationResult();
        break;
      case GameState.AIShoot:
        this.playAIShot();
        break;
      default:
    }
  }

  public update(dt: number) {
    if (this.isInPlay) {
      const result = this.simulation.step({
        simulated: false,
        dt,
        state: this.table.state,
      });
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
      this.aimAssist.update(this.table.cue.getShot(), this.table.state);
    } else {
      this.aimAssist.clear();
    }
    this.table.balls.forEach((ball) => ball.updateProjection());

    this.updateState();
    this.table.update(dt, this.state === GameState.PlayerShoot, !this.isInPlay);
  }
}
