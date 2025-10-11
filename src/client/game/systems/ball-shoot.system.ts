import { ECS, EventSystem } from '@common/ecs';
import { PlayState } from '../controller/game-controller';
import type { GameEvents } from '../events';
import { shoot } from '../plugins/physics/actions/shoot';
import { Physics } from '../plugins/physics/physics.component';
import { SystemState } from '../resources/system-state';

export class BallShootSystem extends EventSystem<'game/shoot', GameEvents> {
  public event = 'game/shoot' as const;

  public run(
    ecs: ECS<GameEvents, unknown>,
    { targetEntity, shot }: GameEvents['game/shoot']
  ): void {
    const [ball] = ecs.get(targetEntity, Physics);
    shoot(ball, shot);

    const systemState = ecs.resource(SystemState);
    systemState.playState = PlayState.PlayerInPlay;
  }
}
