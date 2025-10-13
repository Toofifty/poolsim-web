import { EightBallState } from '@common/simulation/table-state';
import { subscribe } from 'valtio';
import { Resource } from '../../../common/ecs';
import { PlayState } from '../controller/game-controller';
import { gameStore } from '../store/game';
import { settings } from '../store/settings';

export class SystemState extends Resource {
  // todo: new PlayState enum
  private _playState: PlayState = PlayState.Initializing;
  public eightBallState = EightBallState.Open;
  public playerCount = 1;
  public turnIndex = 0;
  public isBreak = true;
  public paused = false;

  constructor() {
    super();

    subscribe(settings, () => {
      this.paused = settings.pauseSimulation;
    });
  }

  get playState() {
    return this._playState;
  }

  set playState(value: PlayState) {
    this._playState = value;
    gameStore.state = value;
  }

  public static create() {
    return new SystemState();
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
