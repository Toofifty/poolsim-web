import { ECS, System, type Entity } from '../../../common/ecs';
import { Renderable } from '../components/renderable';
import type { Game } from '../game';
import { Physics } from '../plugins/physics/physics.component';
import { toQuaternion, toVector3 } from '../util/three-interop';

export class BallUpdateSystem extends System<Game> {
  public components: Set<Function> = new Set([Physics, Renderable]);

  public run(ecs: ECS<any, Game>, entity: Entity): void {
    const [physics, { mesh }] = ecs.get(entity, Physics, Renderable);

    mesh.position.copy(toVector3(physics.r));
    mesh.rotation.setFromQuaternion(toQuaternion(physics.orientation));
  }
}
