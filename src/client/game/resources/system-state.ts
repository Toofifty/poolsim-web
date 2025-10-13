import { EightBallState } from '@common/simulation/table-state';
import { subscribe } from 'valtio';
import { ECS, Resource } from '../../../common/ecs';
import type { GameEvents } from '../events';
import { settings } from '../store/settings';

export enum GameState {
  Initializing = 'Initializing',
  /** A player is aiming */
  Shooting = 'Shooting',
  /** Simulation running / playing */
  Playing = 'Playing',
  /** A player has ball in hand */
  BallInHand = 'BallInHand',
  GameOver = 'GameOver',
}

export class SystemState extends Resource {
  private _gameState: GameState = GameState.Initializing;
  public eightBallState = EightBallState.Open;
  private _currentPlayer = 0;
  public playerCount = 2;
  public turnIndex = 0;
  public isBreak = true;
  public paused = false;

  constructor(private ecs: ECS<GameEvents>) {
    super();

    subscribe(settings, () => {
      this.paused = settings.pauseSimulation;
    });
  }

  get gameState() {
    return this._gameState;
  }

  set gameState(value: GameState) {
    this._gameState = value;
    this.ecs.emit('game/state-update', value);
  }

  get currentPlayer() {
    return this._currentPlayer;
  }

  set currentPlayer(value: number) {
    this._currentPlayer = value;
    this.ecs.emit('game/current-player-update', value);
  }

  public static create(ecs: ECS<GameEvents>) {
    return new SystemState(ecs);
  }

  get currentPlayer8BallState() {
    if (this.eightBallState === EightBallState.Open) {
      return 'open';
    }

    if (
      (this.turnIndex === 0) ===
      (this.eightBallState === EightBallState.Player1Solids)
    ) {
      return 'solids';
    }

    return 'stripes';
  }
}
