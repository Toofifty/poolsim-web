import { ECS, EventSystem } from '@common/ecs';
import { RuleSet } from '@common/simulation/physics';
import { EightBallState } from '@common/simulation/table-state';
import { PlayState } from '../../controller/game-controller';
import type { GameEvents } from '../../events';
import { GameRuleProvider } from '../../resources/game-rules';
import { SystemState } from '../../resources/system-state';

export class StateUpdateSystem extends EventSystem<'game/settled', GameEvents> {
  public event = 'game/settled' as const;

  public run(
    ecs: ECS<GameEvents, unknown>,
    data: GameEvents['game/settled']
  ): void {
    const system = ecs.resource(SystemState);

    if (system.playState === PlayState.PlayerInPlay) {
      system.playState = PlayState.PlayerShoot;
    }

    // update 8 ball state
    const ruleSet = ecs.resource(GameRuleProvider).ruleSet;
    if (
      ruleSet === RuleSet._8Ball &&
      system.eightBallState === EightBallState.Open
    ) {
      let pottedSolid = false;
      let pottedStripe = false;
      data.result.ballsPotted.forEach((id) => {
        if (id < 8) pottedSolid = true;
        if (id > 8) pottedStripe = true;
      });
      const isPlayer1 = system.turnIndex === 0;
      if (pottedSolid && !pottedStripe) {
        system.eightBallState = isPlayer1
          ? EightBallState.Player1Solids
          : EightBallState.Player1Stripes;
        ecs.emit('game/8-ball-state-change', {
          state: system.eightBallState,
          currentPlayer: system.turnIndex,
        });
      } else if (pottedStripe && !pottedSolid) {
        system.eightBallState = isPlayer1
          ? EightBallState.Player1Stripes
          : EightBallState.Player1Solids;
        ecs.emit('game/8-ball-state-change', {
          state: system.eightBallState,
          currentPlayer: system.turnIndex,
        });
      }
    }

    // if cue ball pocketed, set it as ball in hand

    // if no pottable ball pocketed, switch to next player
  }
}
