import { ECS, System, type Entity } from '../../../common/ecs';
import { Object3DComponent } from '../components/mesh';
import { Physics } from '../components/physics';
import type { Game } from '../game';
import { toVector3 } from '../util/three-interop';

export class BallUpdateSystem extends System<Game> {
  public components: Set<Function> = new Set([Physics, Object3DComponent]);

  public run(ecs: ECS<any, Game>, entity: Entity): void {
    const [physics, { mesh }] = ecs.get(entity, Physics, Object3DComponent);

    mesh.position.copy(toVector3(physics.r));
  }
}
