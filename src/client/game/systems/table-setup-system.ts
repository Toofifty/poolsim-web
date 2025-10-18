import { defaultParams } from '@common/simulation/physics';
import { EightBallState } from '@common/simulation/table-state';
import { ECS, EventSystem } from '../../../common/ecs';
import { BallId } from '../components/ball-id';
import type { GameEvents } from '../events';
import { spawnBall } from '../plugins/ball/spawn-ball';
import { GameRuleProvider } from '../resources/game-rules';
import { GameState, SystemState } from '../resources/system-state';

export class TableSetupSystem extends EventSystem<'game/setup', GameEvents> {
  public event = 'game/setup' as const;

  public run(
    ecs: ECS<GameEvents, unknown>,
    data: GameEvents['game/setup']
  ): void {
    const balls = ecs.query().has(BallId).findAll();
    for (const ball of balls) {
      ecs.removeEntity(ball);
    }

    const system = ecs.resource(SystemState);
    data.rack.forEach((data) => {
      spawnBall(ecs, system.params, data);
    });

    system.gameState = GameState.Shooting;
    system.isBreak = true;
    system.eightBallState = EightBallState.Open;
    // todo: random player start
    system.turnIndex = 0;

    const ruleProvider = ecs.resource(GameRuleProvider);
    ruleProvider.ruleset = data.ruleset;

    ecs.emit('input/cue-update', {
      force: defaultParams.cue.defaultForce,
      top: 0,
      side: 0,
      lift: 0,
    });
  }
}
