import { ECS, EventSystem } from '@common/ecs';
import type { GameEvents } from '../events';
import { shoot } from '../plugins/physics/actions/shoot';
import { Physics } from '../plugins/physics/physics.component';
import { GameState, SystemState } from '../resources/system-state';

export class BallShootSystem extends EventSystem<'game/shoot', GameEvents> {
  public event = 'game/shoot' as const;

  public run(
    ecs: ECS<GameEvents, unknown>,
    { targetEntity, shot }: GameEvents['game/shoot']
  ): void {
    const [ball] = ecs.get(targetEntity, Physics);
    shoot(ball, shot);

    const system = ecs.resource(SystemState);
    system.gameState = GameState.Playing;
  }
}
