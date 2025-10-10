import { subscribe } from 'valtio';
import { Resource } from '../../../common/ecs';
import { PlayState } from '../controller/game-controller';
import { gameStore } from '../store/game';
import { settings } from '../store/settings';

export class SystemState extends Resource {
  private _playState: PlayState = PlayState.Initializing;
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
}
