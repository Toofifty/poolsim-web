import { ECS, EventSystem } from '@common/ecs';
import type { GameEvents } from '../events';
import { findBallById } from '../plugins/gameplay/find-ball-by-id';
import { shoot } from '../plugins/physics/actions/shoot';
import { GameState, SystemState } from '../resources/system-state';

export class BallShootSystem extends EventSystem<'game/shoot', GameEvents> {
  public event = 'game/shoot' as const;

  public run(
    ecs: ECS<GameEvents, unknown>,
    { id, shot }: GameEvents['game/shoot']
  ): void {
    const [_, ball] = findBallById(ecs, id);
    shoot(ball, shot);

    const system = ecs.resource(SystemState);
    system.gameState = GameState.Playing;
  }
}
