import { TypedEventTarget } from 'typescript-event-target';
import type {
  RuleSet,
  SerializedPhysicsBall,
} from '../../../common/simulation/physics';
import type { SerializedOnlineGameState } from '../controller/online-game-controller';
import type { BallProto } from '../objects/ball';
import type { SerializedCue } from '../objects/cue';
import type { NetworkAdapter, NetworkEventMap } from './network-adapter';

/** @deprecated */
export class OfflineAdapter
  extends TypedEventTarget<NetworkEventMap>
  implements NetworkAdapter
{
  public isHost = true;
  public isMultiplayer = false;
  setupTable(data: { rack: BallProto[]; ruleSet: RuleSet }): void {}
  resetCueBall(): void {}
  setGameState(state: SerializedOnlineGameState): void {}
  placeBallInHand(ball: SerializedPhysicsBall): void {}
  updateBallInHand(ball: SerializedPhysicsBall): void {}
  updateCue(cue: SerializedCue): void {}
  shoot(cue: SerializedCue): void {}
}
