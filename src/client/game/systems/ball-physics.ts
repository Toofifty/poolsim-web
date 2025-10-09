import { ECS, System, type Entity } from '../../../common/ecs';
import { Physics } from '../components/physics';
import type { Game } from '../game';

export class BallPhysicsSystem extends System<Game> {
  public components: Set<Function> = new Set([Physics]);

  public run(ecs: ECS<any, Game>, entity: Entity): void {}
}
