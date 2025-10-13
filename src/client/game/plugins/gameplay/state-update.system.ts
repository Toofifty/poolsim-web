import { ECS, EventSystem } from '@common/ecs';
import { vec } from '@common/math';
import { Ruleset } from '@common/simulation/physics';
import { EightBallState } from '@common/simulation/table-state';
import { assert, assertExists } from '@common/util';
import { PlayState } from '../../controller/game-controller';
import type { GameEvents } from '../../events';
import { GameRuleProvider } from '../../resources/game-rules';
import { SystemState } from '../../resources/system-state';
import { Physics } from '../physics/physics.component';
import { getTurnResult, isGameOver } from '../physics/simulation/result';

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

    const turnResult = getTurnResult(data.result, data.rules);
    const gameOver = isGameOver(data.result, data.rules);

    // todo: ball in hand
    if (turnResult.fouled) {
      ecs.emit('game/foul', turnResult);

      if (gameOver) {
        ecs.emit('game/game-over', {
          winner: (system.turnIndex + 1) % system.playerCount,
        });
        return;
      }

      const cueBallEntity = ecs.query().has(Physics).findOne();
      assertExists(cueBallEntity);
      const [physics] = ecs.get(cueBallEntity, Physics);
      assert(physics.id === 0, 'Expected cue ball to be first ball entity');
      vec.mset(physics.r, 0, 0, 0);
      vec.mset(physics.v, 0, 0, 0);
      vec.mset(physics.w, 0, 0, 0);
      return;
    }

    if (gameOver) {
      ecs.emit('game/game-over', {
        winner: system.turnIndex,
      });
      return;
    }

    // update 8 ball state
    const ruleset = ecs.resource(GameRuleProvider).ruleset;
    if (
      ruleset === Ruleset._8Ball &&
      system.eightBallState === EightBallState.Open &&
      !system.isBreak
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

    // todo: game over check here

    if (!turnResult.success) {
      system.turnIndex = (system.turnIndex + 1) % system.playerCount;
      ecs.emit('game/change-player', system.turnIndex);
    }
  }
}
