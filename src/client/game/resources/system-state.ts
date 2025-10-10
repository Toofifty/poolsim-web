import { Resource } from '../../../common/ecs';
import { PlayState } from '../controller/game-controller';

export class SystemState extends Resource {
  public playState: PlayState = PlayState.Initializing;

  constructor() {
    super();
  }

  public static create() {
    return new SystemState();
  }
}
