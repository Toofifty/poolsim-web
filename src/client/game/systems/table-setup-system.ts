import { ECS, EventSystem } from '../../../common/ecs';
import { BallId } from '../components/ball-id';
import { PlayState } from '../controller/game-controller';
import { spawnBall } from '../entities/ball';
import type { GameEvents } from '../events';
import { SystemState } from '../resources/system-state';

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

    data.rack.forEach((data) => {
      spawnBall(ecs, data);
    });

    const systemState = ecs.resource(SystemState);
    systemState.playState = PlayState.PlayerShoot;
  }
}
