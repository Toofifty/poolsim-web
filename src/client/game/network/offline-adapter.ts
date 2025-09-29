import { TypedEventTarget } from 'typescript-event-target';
import type { SerializedPhysicsBall } from '../../../common/simulation/physics';
import type { RuleSet } from '../../../common/simulation/table-state';
import type { SerializedOnlineGameState } from '../controller/online-game-controller';
import type { BallProto } from '../objects/ball';
import type { SerializedCue } from '../objects/cue';
import type { NetworkAdapter, NetworkEventMap } from './network-adapter';

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
