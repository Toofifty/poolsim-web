import { subscribe } from 'valtio';
import { vec } from '../../common/math';
import { properties } from '../../common/simulation/physics/properties';
import { Result } from '../../common/simulation/result';
import { Simulation } from '../../common/simulation/simulation';
import { RuleSet } from '../../common/simulation/table-state';
import { AI } from './ai';
import { Game } from './game';
import type { INetwork } from './network';
import { Ball, type BallProto } from './objects/ball';
import { Table } from './objects/table';
import { Rack } from './rack';
import { AimAssist } from './simulation/aim-assist';
import { gameStore } from './store/game';
import { AimAssistMode, Players, settings } from './store/settings';
import { delay } from './util/delay';
import { toVector3 } from './util/three-interop';

export type SerializedGameState = {
  /** Always relative to player 1 */
  state: GameState;
};

export enum GameState {
  PlayerShoot,
  PlayerOtherShoot,
  AIShoot,
  PlayerInPlay,
  PlayerOtherInPlay,
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

  constructor(private network: INetwork) {
    this.table = new Table(network);
    this.simulation = new Simulation();
    this.ai = new AI();
    this.aimAssist = new AimAssist();

    this.resetSimulationResult();
    this.setupNetwork();
    this.setup9Ball();
    this.startGame();

    if (!network.isMultiplayer) {
      // immediately make AI shoot if setting changes to AIvAI
      subscribe(settings, ([[op, [path], value]]) => {
        if (op === 'set' && path === 'players' && value === Players.AIVsAI) {
          if (this.state === GameState.PlayerShoot) {
            this.setState(GameState.AIShoot);
          }
        }
      });
    }
  }

  private resetSimulationResult() {
    this.currentSimulationResult = new Result(undefined, this.table.state);
  }

  private setupNetwork() {
    this.network.onSyncGameState((state) => this.sync(state));
    this.network.onSyncCue((cue) => this.table.cue.sync(cue, this.table.balls));
    this.network.onShootCue((cue) => {
      console.log('shoot-cue');
      this.table.cue.sync(cue, this.table.balls);
      // if local, cue would have already shot and this
      // won't run
      this.table.cue.shoot(() => {
        this.setState(GameState.PlayerOtherInPlay);
      });
    });
    this.network.onSyncTableState((tableState) => {
      this.table.state.sync(tableState);
    });
    this.network.onSetupTable((data) => this.setupTable(data));
  }

  public placeCueBall() {
    this.table.cueBall.place(-properties.tableLength / 4, 0);
  }

  public setup8Ball() {
    this.setupTable({
      rack: Rack.generate8Ball(),
      ruleSet: RuleSet._8Ball,
    });
  }

  public setup9Ball() {
    this.setupTable({
      rack: Rack.generate9Ball(),
      ruleSet: RuleSet._9Ball,
    });
  }

  public setupDebugGame() {
    this.setupTable({
      rack: Rack.generateDebugGame(),
      ruleSet: RuleSet._9Ball,
    });
  }

  public setupTable({
    rack,
    ruleSet,
  }: {
    rack: BallProto[];
    ruleSet: RuleSet;
  }) {
    this.table.clearBalls();
    this.table.addBalls(...rack.map((proto) => new Ball(proto)));
    this.ruleSet = ruleSet;
    this.table.state.ruleSet = ruleSet;
    this.aimAssist.setBalls([...this.table.balls]);
    if (this.network.isHost) {
      this.network.setupTable({ rack, ruleSet });
    }
  }

  public startGame() {
    this.resetSimulationResult();
    if (!this.network.isHost) return;
    if (this.network.isMultiplayer) {
      this.setState(
        Math.random() > 0.5 ? GameState.PlayerShoot : GameState.PlayerOtherShoot
      );
    } else {
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
    this.table.state.isBreak = true;
    this.network.syncTableState(this.table.state.serialize());
  }

  public shoot() {
    this.table.cue.shoot(() => {
      this.setState(GameState.PlayerInPlay);
    });
    this.network.shootCue(this.table.cue.serialize());
  }

  public mousedown(event: MouseEvent) {
    if (event.button === 0 && this.state === GameState.PlayerShoot) {
      this.shoot();
    }
  }

  get isInPlay() {
    return (
      this.state === GameState.AIInPlay ||
      this.state === GameState.PlayerInPlay ||
      this.state === GameState.PlayerOtherInPlay
    );
  }

  private shouldSwitchTurn(result?: Result) {
    result ??= this.currentSimulationResult;
    console.log({
      hasFoul: result.hasFoul(),
      potted: result.ballsPotted,
      result,
    });
    return result.hasFoul() || result.ballsPotted === 0;
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
    this.network.syncGameState(this.serialize());
    this.network.syncTableState(this.table.state.serialize());
  }

  private updateMultiplayerState() {
    if (!this.network.isHost) return;
    if (!this.table.settled) return;

    if (
      this.table.state.cueBall.isPocketedStationary ||
      this.table.state.cueBall.isOutOfBounds
    ) {
      this.placeCueBall();
    }

    if (this.table.state.isGameOver) {
      this.resetSimulationResult();
      if (!this.network.isHost) return;

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
        this.setState(
          this.shouldSwitchTurn()
            ? GameState.PlayerOtherShoot
            : GameState.PlayerShoot
        );
        break;
      case GameState.PlayerOtherInPlay:
        this.table.state.isBreak = false;
        this.setState(
          this.shouldSwitchTurn()
            ? GameState.PlayerShoot
            : GameState.PlayerOtherShoot
        );
        break;
      default:
    }
  }

  private updateLocalState() {
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
      this.currentSimulationResult.add(result);
      result.collisions.forEach((collision) => {
        if (collision.type === 'ball-ball') {
          Game.audio.play(
            'clack_mid',
            toVector3(collision.position),
            Math.min(vec.len(collision.impulse) * 2, 5)
          );
        }
        if (collision.type === 'ball-pocket') {
          Game.audio.play('pocket_drop', toVector3(collision.position));
        }
      });
    }

    if (
      (this.state === GameState.PlayerShoot ||
        this.state === GameState.PlayerOtherShoot ||
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

    if (this.network.isMultiplayer) {
      this.updateMultiplayerState();
    } else {
      this.updateLocalState();
    }
    this.table.update(dt, this.state === GameState.PlayerShoot);
  }

  public serialize() {
    return {
      state: this.state,
    } satisfies SerializedGameState;
  }

  private invertState(state: GameState) {
    switch (state) {
      case GameState.PlayerShoot:
        return GameState.PlayerOtherShoot;
      case GameState.PlayerInPlay:
        return GameState.PlayerOtherInPlay;
      case GameState.PlayerOtherShoot:
        return GameState.PlayerShoot;
      case GameState.PlayerOtherInPlay:
        return GameState.PlayerInPlay;
      default:
        return state;
    }
  }

  public sync(state: SerializedGameState) {
    this.setState(this.invertState(state.state));
  }
}
