import { Table } from './objects/table';
import { Ball } from './objects/ball';
import { Rack } from './rack';
import { Simulation } from './simulation/simulation';
import { Game } from './game';
import { AimAssistMode, Players, settings } from './store/settings';
import { properties } from './physics/properties';
import { gameStore } from './store/game';
import { AI } from './ai';
import { delay } from './util/delay';
import { RuleSet } from './simulation/table-state';
import { AimAssist } from './simulation/aim-assist';
import { subscribe } from 'valtio';
import { Result } from './physics/result';
import { vec } from './physics/math';

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
    this.setupDebugGame();
    this.startGame();

    // immediately make AI shoot if setting changes to AIvAI
    subscribe(settings, ([[op, [path], value]]) => {
      if (op === 'set' && path === 'players' && value === Players.AIVsAI) {
        if (this.state === GameState.PlayerShoot) {
          this.setState(GameState.AIShoot);
        }
      }
    });
  }

  private resetSimulationResult() {
    this.currentSimulationResult = new Result(undefined, this.table.state);
  }

  public placeCueBall() {
    if (!this.table.cueBall) {
      this.table.addBalls(new Ball(0, 0, properties.colorCueBall));
    }
    this.table.cueBall.place(-properties.tableLength / 4, 0);
  }

  public setup8Ball() {
    this.table.clearBalls();
    this.placeCueBall();
    this.table.addBalls(...Rack.generate8Ball(properties.tableLength / 4, 0));
    this.ruleSet = RuleSet._8Ball;
    this.table.state.ruleSet = RuleSet._8Ball;
    this.aimAssist.setBalls([...this.table.balls]);
  }

  public setup9Ball() {
    this.table.clearBalls();
    this.placeCueBall();
    this.table.addBalls(...Rack.generate9Ball(properties.tableLength / 4, 0));
    this.ruleSet = RuleSet._9Ball;
    this.table.state.ruleSet = RuleSet._9Ball;
    this.aimAssist.setBalls([...this.table.balls]);
  }

  public setupDebugGame() {
    this.table.clearBalls();
    this.placeCueBall();
    this.table.addBalls(
      ...Rack.generateDebugGame(properties.tableLength / 4, 0)
    );
    this.ruleSet = RuleSet.Debug;
    this.table.state.ruleSet = RuleSet.Debug;
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
    this.table.state.isBreak = true;
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
    const shot = await this.ai.findShot(
      this.table.state,
      this.table.cue.topSpin
    );
    if (!shot) return;
    // let dt catch up before animating the cue
    await delay(100);

    // const oldShot = this.table.cue.getShot();
    this.table.cue.setShot(shot);
    await delay(2000);
    this.table.cue.shoot(async () => {
      this.setState(GameState.AIInPlay);
      await delay(500);
      // this.table.cue.setShot(oldShot);
      this.aiIsThinking = false;
    });
  }

  private setState(state: GameState) {
    this.resetSimulationResult();
    this.state = state;
    gameStore.state = state;
  }

  private updateState() {
    if (!this.table.settled) {
      return;
    }

    if (
      this.table.state.cueBall.isPocketedStationary ||
      this.table.state.cueBall.isOutOfBounds
    ) {
      this.placeCueBall();
    }

    if (this.table.state.isGameOver) {
      this.resetSimulationResult();
      switch (this.ruleSet) {
        case RuleSet._8Ball:
          this.setup8Ball();
          break;
        default:
          this.setup9Ball();
          break;
      }
      this.startGame();
      return;
    }

    switch (this.state) {
      case GameState.PlayerInPlay:
        this.table.state.isBreak = false;
        if (settings.players === Players.PlayerVsPlayer) {
          this.setState(GameState.PlayerShoot);
        } else if (settings.players === Players.AIVsAI) {
          this.setState(GameState.AIShoot);
        } else {
          this.setState(
            this.shouldSwitchTurn() ? GameState.AIShoot : GameState.PlayerShoot
          );
        }
        break;
      case GameState.AIInPlay:
        this.table.state.isBreak = false;
        if (settings.players === Players.PlayerVsPlayer) {
          this.setState(GameState.PlayerShoot);
        } else if (settings.players === Players.AIVsAI) {
          this.setState(GameState.AIShoot);
        } else {
          this.setState(
            this.shouldSwitchTurn() ? GameState.PlayerShoot : GameState.AIShoot
          );
        }
        break;
      case GameState.AIShoot:
        this.playAIShot();
        break;
      default:
    }
  }

  public update(dt: number) {
    if (this.isInPlay && !settings.pauseSimulation) {
      const result = this.simulation.step({
        simulated: false,
        trackPath: false,
        dt,
        state: this.table.state,
      });
      if (result.collisions.length < 2) {
        result.collisions.forEach((collision) => {
          if (collision.type === 'ball-ball') {
            Game.audio.play(
              'clack_mid',
              vec.toVector3(collision.position),
              Math.min(vec.len(collision.impulse) * 2, 5)
            );
          }
          if (collision.type === 'ball-pocket') {
            Game.audio.play('pocket_drop', vec.toVector3(collision.position));
          }
        });
      }
    }

    if (
      (this.state === GameState.PlayerShoot ||
        this.state === GameState.AIShoot) &&
      !this.table.cue.isShooting &&
      settings.aimAssistMode !== AimAssistMode.Off
    ) {
      this.aimAssist
        .update(this.table.cue.getShot(), this.table.state)
        .then(() => {
          this.table.balls.forEach((ball) => ball.updateProjection());
        });
    } else {
      this.aimAssist.clear();
      this.table.balls.forEach((ball) => ball.updateProjection());
    }

    this.updateState();
    this.table.update(dt, this.state === GameState.PlayerShoot);
  }
}
