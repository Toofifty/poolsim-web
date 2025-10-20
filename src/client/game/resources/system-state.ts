import type { LobbyData } from '@common/data';
import {
  cloneParams,
  EightBallState,
  type Params,
} from '@common/simulation/physics';
import type { Socket } from 'socket.io-client';
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
  /** Index of the current player. Host will always be 0 */
  private _currentPlayer = 0;
  public playerCount = 2;
  private _turnIndex = 0;
  public isBreak = true;
  public paused = false;

  constructor(
    private ecs: ECS<GameEvents>,
    private _params: Params,
    public isOnline: boolean,
    public isHost: boolean
  ) {
    super();

    if (!isOnline || isHost) {
      subscribe(settings, () => {
        this.paused = settings.pauseSimulation;
      });
    }
  }

  public static create(
    ecs: ECS<GameEvents>,
    params: Params,
    socket?: Socket,
    lobby?: LobbyData
  ) {
    return new SystemState(
      ecs,
      cloneParams(params),
      !!(socket && lobby),
      !socket || !lobby || lobby.hostId === socket.id
    );
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

  get turnIndex() {
    return this._turnIndex;
  }

  set turnIndex(value: number) {
    this._turnIndex = value;
    this.ecs.emit('game/change-player', value);
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

  get isActivePlayer() {
    if (!this.isOnline) return true;

    return this.turnIndex === this.currentPlayer;
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
    if (!this.isActivePlayer) return false;

    return (
      this.gameState === GameState.BallInHand ||
      (this.gameState === GameState.Shooting && this.isBreak)
    );
  }
}
