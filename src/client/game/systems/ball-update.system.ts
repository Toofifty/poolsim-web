import { ECS, System, type Entity } from '../../../common/ecs';
import { BallMesh } from '../components/ball-mesh';
import type { Game } from '../game';
import { Physics } from '../plugins/physics/physics.component';
import { toQuaternion, toVector3 } from '../util/three-interop';

export class BallUpdateSystem extends System<Game> {
  public components: Set<Function> = new Set([Physics, BallMesh]);

  public run(ecs: ECS<any, Game>, entity: Entity): void {
    const [physics, { mesh }] = ecs.get(entity, Physics, BallMesh);

    mesh.position.copy(toVector3(physics.r));
    mesh.rotation.setFromQuaternion(toQuaternion(physics.orientation));
  }
}
