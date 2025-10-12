import type { TypedEventListenerOrEventListenerObject } from 'typescript-event-target';
import {
  AimAssistMode,
  defaultParams,
  Ruleset,
  type Params,
} from '../../../common/simulation/physics';
import {
  EightBallState,
  Player,
  type SerializedTableState,
} from '../../../common/simulation/table-state';
import { assert, assertEqual } from '../../../common/util';
import { Game } from '../game';
import type {
  NetworkAdapter,
  NetworkEventMap,
} from '../network/network-adapter';
import { gameStore } from '../store/game';
import {
  BaseGameController,
  PlayState,
  type GameEventListener,
} from './game-controller';
import type { InputController } from './input-controller';

export type SerializedOnlineGameState = {
  playState: PlayState;
  state: SerializedTableState;
};

export type NetworkEventListener<K extends keyof NetworkEventMap> =
  TypedEventListenerOrEventListenerObject<NetworkEventMap, K>;

export class OnlineGameController extends BaseGameController {
  constructor(
    params: Params,
    input: InputController,
    private adapter: NetworkAdapter
  ) {
    super(params, input);

    this.connect();

    if (this.isHost) {
      setTimeout(() => {
        switch (this.params.game.ruleset) {
          case Ruleset.Sandbox:
            this.setupSandboxGame();
            break;
          case Ruleset._8Ball:
            this.setup8Ball();
            break;
          case Ruleset._9Ball:
            this.setup9Ball();
            break;
        }
        this.startGame();
      }, 1000);
    }
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
    this.adapter.addEventListener(
      'lobby-player-join',
      this.onNetworkLobbyPlayerJoin
    );
    this.adapter.addEventListener(
      'lobby-player-leave',
      this.onNetworkLobbyPlayerLeave
    );
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
    this.adapter.removeEventListener(
      'lobby-player-join',
      this.onNetworkLobbyPlayerJoin
    );
    this.adapter.removeEventListener(
      'lobby-player-leave',
      this.onNetworkLobbyPlayerLeave
    );
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
  }) => this.syncGameState(detail);

  private onGamePlaceBallInHand: GameEventListener<'place-ball-in-hand'> = ({
    detail: ball,
  }) => {
    assert(this.playState === PlayState.PlayerBallInHand);
    this.adapter.placeBallInHand(ball);
  };

  private onNetworkPlaceBallInHand: NetworkEventListener<'place-ball-in-hand'> =
    ({ detail: ball }) => {
      const target = this.balls.find(({ id }) => id === ball.id);
      assert(target);
      target.physics.sync(ball, this.state.pockets);
      target.sync();

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
        ?.physics.sync(
          ball,
          this.state.pockets,
          defaultParams.network.throttle
        );
    };

  private onGameUpdateCue: GameEventListener<'update-cue'> = () => {
    assertEqual(this.playState, PlayState.PlayerShoot);
    this.adapter.updateCue(this.cue.serialize());
  };

  private onNetworkUpdateCue: NetworkEventListener<'update-cue'> = ({
    detail: cue,
  }) => this.cue.sync(cue, this.balls);

  private onGameShoot: GameEventListener<'shoot'> = () => {
    assertEqual(this.playState, PlayState.PlayerShoot);
    this.adapter.shoot(this.cue.serialize());
  };

  private onNetworkShoot: NetworkEventListener<'shoot'> = ({ detail: cue }) => {
    this.cue.sync(cue, this.balls, true);
    this.cue.shoot(() => {
      this.setPlayState(PlayState.OpponentInPlay, true);
    });
  };

  private onNetworkLobbyPlayerJoin: NetworkEventListener<'lobby-player-join'> =
    () => {
      this.setPlayState(this.playState);
    };

  private onNetworkLobbyPlayerLeave: NetworkEventListener<'lobby-player-leave'> =
    () => {};

  // end listeners

  private get isHost() {
    return this.adapter?.isHost ?? false;
  }

  public startGame(): void {
    if (!this.isHost) return;

    this.state.reset();
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
    if (this.isHost) {
      // update player in table state before emitting
      if (
        state === PlayState.OpponentBallInHand ||
        state === PlayState.OpponentShoot
      ) {
        this.state.currentPlayer = Player.Two;
      }
      if (
        state === PlayState.PlayerBallInHand ||
        state === PlayState.PlayerShoot
      ) {
        this.state.currentPlayer = Player.One;
      }
    }

    super.setPlayState(state, noEmit);
    gameStore.state = state;
  }

  protected shouldShowAimAssist(): boolean {
    return this.params.game.aimAssist !== AimAssistMode.Off;
  }

  protected updateState(): void {
    if (!this.isHost || this.playState === PlayState.Initializing) return;

    if (this.state.isGameOver) {
      if (this.shouldSwitchTurn()) {
        Game.audio.play('sad_trumpet', undefined, 1);
      } else {
        Game.audio.play('win');
      }
      this.setupPrevious();
      this.startGame();
      return;
    }

    this.update8BallState();

    switch (this.playState) {
      case PlayState.PlayerInPlay:
        this.state.isBreak = false;
        if (this.shouldPutBallInHand()) {
          this.cue.reset();
          this.setPlayState(PlayState.OpponentBallInHand);
          break;
        }
        if (this.shouldSwitchTurn()) {
          this.cue.reset();
          this.setPlayState(PlayState.OpponentShoot);
        } else {
          this.setPlayState(PlayState.PlayerShoot);
        }
        break;
      case PlayState.OpponentInPlay:
        this.state.isBreak = false;
        if (this.shouldPutBallInHand()) {
          this.putBallInHand();
          this.cue.reset();
          this.setPlayState(PlayState.PlayerBallInHand);
          break;
        }
        if (this.shouldSwitchTurn()) {
          this.cue.reset();
          this.setPlayState(PlayState.PlayerShoot);
        } else {
          this.setPlayState(PlayState.OpponentShoot);
        }
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

  private syncGameState({ playState, state }: SerializedOnlineGameState) {
    if (
      this.state.ruleset === Ruleset._8Ball &&
      this.state.eightBallState === EightBallState.Open &&
      state.eightBallState !== EightBallState.Open
    ) {
      this.dispatchTypedEvent(
        '8-ball-state-change',
        new CustomEvent('8-ball-state-change', {
          detail: {
            state: state.eightBallState,
            isPlayer1: false,
          },
        })
      );
    }

    this.setPlayState(this.invertPlayState(playState));
    this.state.sync(state);
    if (this.playState === PlayState.PlayerBallInHand) {
      this.putBallInHand();
    }
  }
}
