import type { TypedEventTarget } from 'typescript-event-target';
import type { SerializedPhysicsBall } from '../../../common/simulation/physics';
import type { RuleSet } from '../../../common/simulation/table-state';
import type { SerializedOnlineGameState } from '../controller/online-game-controller';
import type { BallProto } from '../objects/ball';
import type { SerializedCue } from '../objects/cue';

export type NetworkEventMap = {
  ['setup-table']: CustomEvent<{ rack: BallProto[]; ruleSet: RuleSet }>;
  ['reset-cue-ball']: Event;
  ['set-game-state']: CustomEvent<SerializedOnlineGameState>;
  ['place-ball-in-hand']: CustomEvent<SerializedPhysicsBall>;
  ['update-ball-in-hand']: CustomEvent<SerializedPhysicsBall>;
  ['update-cue']: CustomEvent<SerializedCue>;
  ['shoot']: CustomEvent<SerializedCue>;
};

export interface NetworkAdapter extends TypedEventTarget<NetworkEventMap> {
  isHost: boolean;
  isMultiplayer: boolean;
  setupTable(data: { rack: BallProto[]; ruleSet: RuleSet }): void;
  resetCueBall(): void;
  setGameState(state: SerializedOnlineGameState): void;
  placeBallInHand(ball: SerializedPhysicsBall): void;
  updateBallInHand(ball: SerializedPhysicsBall): void;
  updateCue(cue: SerializedCue): void;
  shoot(cue: SerializedCue): void;
}
