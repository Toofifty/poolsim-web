import type { Params } from '../../../common/simulation/physics';
import type { SerializedTableState } from '../../../common/simulation/table-state';
import { assert } from '../../../common/util';
import type { NetworkAdapter } from '../network/network-adapter';
import { gameStore } from '../store/game';
import { BaseGameController, PlayState } from './game-controller';
import type { InputController } from './input-controller';

export type SerializedOnlineGameState = {
  playState: PlayState;
  state: SerializedTableState;
};

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
      this.addEventListener('setup-table', ({ detail }) => {
        this.adapter.setupTable(detail);
      });
      this.addEventListener('reset-cue-ball', () => {
        this.adapter.resetCueBall();
      });
      this.addEventListener('set-game-state', () => {
        this.adapter.setGameState(this.serialize());
      });
    } else {
      this.adapter.addEventListener('setup-table', ({ detail }) => {
        this.setupTable(detail);
      });
      this.adapter.addEventListener('reset-cue-ball', () => {
        this.resetCueBall();
      });
      this.adapter.addEventListener('set-game-state', ({ detail }) => {
        console.log('set-game-state - receive');
        this.setGameState(detail);
      });
    }

    this.addEventListener('place-ball-in-hand', ({ detail: ball }) => {
      assert(this.playState === PlayState.PlayerBallInHand);
      this.adapter.placeBallInHand(ball);
    });

    this.adapter.addEventListener('place-ball-in-hand', ({ detail: ball }) => {
      this.balls
        .find(({ id }) => id === ball.id)
        ?.physics.sync(ball, this.state.pockets);
      this.setPlayState(PlayState.OpponentShoot);
    });

    this.addEventListener('update-ball-in-hand', () => {
      assert(this.playState === PlayState.PlayerBallInHand);
      assert(this.ballInHand);
      this.adapter.updateBallInHand(this.ballInHand.physics.serialize());
    });

    this.adapter.addEventListener('update-ball-in-hand', ({ detail: ball }) => {
      this.balls
        .find(({ id }) => id === ball.id)
        ?.physics.sync(ball, this.state.pockets);
    });

    this.addEventListener('update-cue', () => {
      assert(this.playState === PlayState.PlayerShoot);
      this.adapter.updateCue(this.cue.serialize());
    });

    this.adapter.addEventListener('update-cue', ({ detail: cue }) => {
      this.cue.sync(cue, this.balls);
    });

    this.addEventListener('shoot', () => {
      assert(this.playState === PlayState.PlayerShoot);
      console.log('shoot - send');
      this.adapter.shoot(this.cue.serialize());
    });

    this.adapter.addEventListener('shoot', ({ detail: cue }) => {
      console.log('shoot - recieve');
      this.cue.sync(cue, this.balls);
      this.cue.shoot(() => {
        this.setPlayState(PlayState.OpponentInPlay);
      });
    });
  }

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

    console.log('shoot - local');
    this.cue.shoot(() => {
      this.setPlayState(PlayState.PlayerInPlay);
    });
  }

  protected setPlayState(state: PlayState): void {
    super.setPlayState(state);
    gameStore.state = state;
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
