import { ECS, System, type Entity } from '@common/ecs';
import { Physics } from '../../components/physics';
import { PlayState } from '../../controller/game-controller';
import { SystemState } from '../../resources/system-state';
import { evolveMotion } from './evolution/evolve';

export class MotionSystem extends System {
  public components: Set<Function> = new Set([Physics]);

  public before(ecs: ECS<any, unknown>, entities: Set<Entity>): boolean {
    const systemState = ecs.resource(SystemState);
    return systemState.playState === PlayState.PlayerInPlay;
  }

  public run(ecs: ECS<any, unknown>, entity: Entity): void {
    const [ball] = ecs.get(entity, Physics);
    evolveMotion(ball, ecs.deltaTime);

    // todo: do ALL physics here
  }
}
