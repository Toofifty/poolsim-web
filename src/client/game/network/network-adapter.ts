import type { SerializedPhysicsBall } from '../../../common/simulation/physics';
import type {
  RuleSet,
  SerializedTableState,
} from '../../../common/simulation/table-state';
import type { SerializedGameState } from '../game-manager';
import type { BallProto } from '../objects/ball';
import type { SerializedCue } from '../objects/cue';

export interface NetworkAdapter {
  isHost: boolean;
  isMultiplayer: boolean;
  setupTable(data: { rack: BallProto[]; ruleSet: RuleSet }): void;
  onSetupTable(
    fn?: (data: { rack: BallProto[]; ruleSet: RuleSet }) => void
  ): void;
  /** Only callable on host */
  syncGameState(gameState: SerializedGameState): void;
  /** Only called on non-host */
  onSyncGameState(fn?: (gameState: SerializedGameState) => void): void;
  /** Only callable on host */
  syncTableState(tableState: SerializedTableState): void;
  /** Only called on non-host */
  onSyncTableState(fn?: (tableState: SerializedTableState) => void): void;
  syncSingleBall(ballState: SerializedPhysicsBall): void;
  onSyncSingleBall(fn?: (ballState: SerializedPhysicsBall) => void): void;
  placeBallInHand(): void;
  onPlaceBallInHand(fn?: () => void): void;
  shootCue(cue: SerializedCue): void;
  onShootCue(fn?: (cue: SerializedCue) => void): void;
  syncCue(cue: SerializedCue): void;
  onSyncCue(fn?: (cue: SerializedCue) => void): void;
}
