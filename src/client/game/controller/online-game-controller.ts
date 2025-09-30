import type { TypedEventListenerOrEventListenerObject } from 'typescript-event-target';
import type { Params } from '../../../common/simulation/physics';
import type { SerializedTableState } from '../../../common/simulation/table-state';
import { assert } from '../../../common/util';
import type {
  NetworkAdapter,
  NetworkEventMap,
} from '../network/network-adapter';
import { gameStore } from '../store/game';
import { AimAssistMode } from '../store/settings';
import {
  BaseGameController,
  PlayState,
  type GameControllerEventMap,
} from './game-controller';
import type { InputController } from './input-controller';

export type SerializedOnlineGameState = {
  playState: PlayState;
  state: SerializedTableState;
};

type GameEventListener<K extends keyof GameControllerEventMap> =
  TypedEventListenerOrEventListenerObject<GameControllerEventMap, K>;

type NetworkEventListener<K extends keyof NetworkEventMap> =
  TypedEventListenerOrEventListenerObject<NetworkEventMap, K>;

export class OnlineGameController extends BaseGameController {
  constructor(
    params: Params,
    input: InputController,
    private adapter: NetworkAdapter
  ) {
    super(params, input);

    this.connect();

    setTimeout(() => {
      this.setup9Ball();
      this.startGame();
    }, 5000);
  }

  private connect() {
    if (this.isHost) {
      this.addEventListener('setup-table', this.onGameSetupTable);
      this.addEventListener('reset-cue-ball', this.onGameResetCueBall);
      this.addEventListener('set-game-state', this.onGameSetGameState);
    } else {
      this.adapter.addEventListener('setup-table', this.onNetworkSetupTable);
      this.adapter.addEventListener(
        'reset-cue-ball',
        this.onNetworkResetCueBall
      );
      this.adapter.addEventListener(
        'set-game-state',
        this.onNetworkSetGameState
      );
    }

    this.addEventListener('place-ball-in-hand', this.onGamePlaceBallInHand);
    this.adapter.addEventListener(
      'place-ball-in-hand',
      this.onNetworkPlaceBallInHand
    );
    this.addEventListener('update-ball-in-hand', this.onGameUpdateBallInHand);
    this.adapter.addEventListener(
      'update-ball-in-hand',
      this.onNetworkUpdateBallInHand
    );
    this.addEventListener('update-cue', this.onGameUpdateCue);
    this.adapter.addEventListener('update-cue', this.onNetworkUpdateCue);
    this.addEventListener('shoot', this.onGameShoot);
    this.adapter.addEventListener('shoot', this.onNetworkShoot);
  }

  public disconnect() {
    if (this.isHost) {
      this.removeEventListener('setup-table', this.onGameSetupTable);
      this.removeEventListener('reset-cue-ball', this.onGameResetCueBall);
      this.removeEventListener('set-game-state', this.onGameSetGameState);
    } else {
      this.adapter.removeEventListener('setup-table', this.onNetworkSetupTable);
      this.adapter.removeEventListener(
        'reset-cue-ball',
        this.onNetworkResetCueBall
      );
      this.adapter.removeEventListener(
        'set-game-state',
        this.onNetworkSetGameState
      );
    }

    this.removeEventListener('place-ball-in-hand', this.onGamePlaceBallInHand);
    this.adapter.removeEventListener(
      'place-ball-in-hand',
      this.onNetworkPlaceBallInHand
    );
    this.removeEventListener(
      'update-ball-in-hand',
      this.onGameUpdateBallInHand
    );
    this.adapter.removeEventListener(
      'update-ball-in-hand',
      this.onNetworkUpdateBallInHand
    );
    this.removeEventListener('update-cue', this.onGameUpdateCue);
    this.adapter.removeEventListener('update-cue', this.onNetworkUpdateCue);
    this.removeEventListener('shoot', this.onGameShoot);
    this.adapter.removeEventListener('shoot', this.onNetworkShoot);
  }

  // listeners
  private onGameSetupTable: GameEventListener<'setup-table'> = ({ detail }) =>
    this.adapter.setupTable(detail);

  private onGameResetCueBall: GameEventListener<'reset-cue-ball'> = () =>
    this.adapter.resetCueBall();

  private onGameSetGameState: GameEventListener<'set-game-state'> = () =>
    this.adapter.setGameState(this.serialize());

  private onNetworkSetupTable: NetworkEventListener<'setup-table'> = ({
    detail,
  }) => this.setupTable(detail);

  private onNetworkResetCueBall: NetworkEventListener<'reset-cue-ball'> = () =>
    this.resetCueBall();

  private onNetworkSetGameState: NetworkEventListener<'set-game-state'> = ({
    detail,
  }) => this.setGameState(detail);

  private onGamePlaceBallInHand: GameEventListener<'place-ball-in-hand'> = ({
    detail: ball,
  }) => {
    assert(this.playState === PlayState.PlayerBallInHand);
    this.adapter.placeBallInHand(ball);
  };

  private onNetworkPlaceBallInHand: NetworkEventListener<'place-ball-in-hand'> =
    ({ detail: ball }) => {
      this.balls
        .find(({ id }) => id === ball.id)
        ?.physics.sync(ball, this.state.pockets);
      this.setPlayState(PlayState.OpponentShoot);
    };

  private onGameUpdateBallInHand: GameEventListener<'update-ball-in-hand'> =
    () => {
      assert(this.playState === PlayState.PlayerBallInHand);
      assert(this.ballInHand);
      this.adapter.updateBallInHand(this.ballInHand.physics.serialize());
    };

  private onNetworkUpdateBallInHand: NetworkEventListener<'update-ball-in-hand'> =
    ({ detail: ball }) => {
      this.balls
        .find(({ id }) => id === ball.id)
        ?.physics.sync(ball, this.state.pockets);
    };

  private onGameUpdateCue: GameEventListener<'update-cue'> = () => {
    assert(this.playState === PlayState.PlayerShoot);
    this.adapter.updateCue(this.cue.serialize());
  };

  private onNetworkUpdateCue: NetworkEventListener<'update-cue'> = ({
    detail: cue,
  }) => this.cue.sync(cue, this.balls);

  private onGameShoot: GameEventListener<'shoot'> = () => {
    assert(this.playState === PlayState.PlayerShoot);
    this.adapter.shoot(this.cue.serialize());
  };

  private onNetworkShoot: NetworkEventListener<'shoot'> = ({ detail: cue }) => {
    this.cue.sync(cue, this.balls);
    this.cue.shoot(() => {
      this.setPlayState(PlayState.OpponentInPlay, true);
    });
  };

  // end listeners

  private get isHost() {
    return this.adapter.isHost;
  }

  public startGame(): void {
    if (!this.isHost) return;

    this.state.isBreak = true;
    this.setPlayState(
      Math.random() > 0.5 ? PlayState.PlayerShoot : PlayState.OpponentShoot
    );
  }

  public shoot(): void {
    if (this.playState !== PlayState.PlayerShoot) return;

    this.cue.shoot(() => {
      // do not emit state update, else host will send
      // the shot _and_ the physics state immediately after
      // the shot, doubling the velocity on non-host
      this.setPlayState(PlayState.PlayerInPlay, true);
    });
  }

  protected setPlayState(state: PlayState, noEmit = false): void {
    super.setPlayState(state, noEmit);
    gameStore.state = state;
  }

  protected shouldShowAimAssist(): boolean {
    return this.params.game.aimAssist !== AimAssistMode.Off;
  }

  protected updateState(): void {
    if (!this.isHost || this.playState === PlayState.Initializing) return;

    if (
      this.state.cueBall.isPocketedStationary ||
      this.state.cueBall.isOutOfBounds
    ) {
      this.resetCueBall();
    }

    if (this.state.isGameOver) {
      this.setupPrevious();
      this.startGame();
      return;
    }

    switch (this.playState) {
      case PlayState.PlayerInPlay:
        this.state.isBreak = false;
        if (this.shouldPutBallInHand()) {
          this.setPlayState(PlayState.OpponentBallInHand);
          break;
        }
        this.setPlayState(
          this.shouldSwitchTurn()
            ? PlayState.OpponentShoot
            : PlayState.PlayerShoot
        );
        break;
      case PlayState.OpponentInPlay:
        this.state.isBreak = false;
        if (this.shouldPutBallInHand()) {
          this.putBallInHand();
          this.setPlayState(PlayState.PlayerBallInHand);
          break;
        }
        this.setPlayState(
          this.shouldSwitchTurn()
            ? PlayState.PlayerShoot
            : PlayState.OpponentShoot
        );
        break;
      case PlayState.PlayerBallInHand:
        if (!this.ballInHand) {
          this.setPlayState(PlayState.PlayerShoot);
        }
        break;
    }
  }

  private serialize(): SerializedOnlineGameState {
    return {
      playState: this.playState,
      state: this.state.serialize(),
    };
  }

  private invertPlayState(playState: PlayState) {
    switch (playState) {
      case PlayState.PlayerShoot:
        return PlayState.OpponentShoot;
      case PlayState.PlayerInPlay:
        return PlayState.OpponentInPlay;
      case PlayState.PlayerBallInHand:
        return PlayState.OpponentBallInHand;
      case PlayState.OpponentShoot:
        return PlayState.PlayerShoot;
      case PlayState.OpponentInPlay:
        return PlayState.PlayerInPlay;
      case PlayState.OpponentBallInHand:
        return PlayState.PlayerBallInHand;
      default:
        return playState;
    }
  }

  private setGameState({ playState, state }: SerializedOnlineGameState) {
    this.setPlayState(this.invertPlayState(playState));
    this.state.sync(state);
    if (this.playState === PlayState.PlayerBallInHand) {
      this.putBallInHand();
    }
  }
}
