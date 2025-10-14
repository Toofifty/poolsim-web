import { type Params } from '@common/simulation/physics';
import { EightBallState } from '@common/simulation/table-state';
import { subscribe } from 'valtio';
import { ECS, Resource } from '../../../common/ecs';
import type { DeepKeyOf, DeepPathOf, DeepReadonly } from '../../util/types';
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
  public ballInHand?: number;

  public isHost = true;

  constructor(private ecs: ECS<GameEvents>, private _params: Params) {
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

  get params(): DeepReadonly<Params> {
    return this._params;
  }

  public setParam(key: DeepKeyOf<Params>, value: unknown) {
    const path = key.split('.');
    const obj = path.slice(0, -1).reduce((o, prop) => {
      // @ts-ignore
      return o[prop];
    }, this._params);
    // @ts-ignore
    obj[path.at(-1)] = value;

    this.ecs.emit('game/param-update', {
      mutated: path.map((_, i, parts) =>
        parts.slice(0, i + 1).join('.')
      ) as DeepPathOf<Params>[],
    });
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

  /**
   * Whether to allow the player to shoot (and update cue etc)
   *
   * "BallInHand" is just an alias for "Shooting" that allows the
   * player to pick up the cue ball at will.
   */
  get isShootable() {
    return (
      this.gameState === GameState.Shooting ||
      this.gameState === GameState.BallInHand
    );
  }

  get canPickupCueBall() {
    return (
      this.gameState === GameState.BallInHand ||
      (this.gameState === GameState.Shooting && this.isBreak)
    );
  }
}
