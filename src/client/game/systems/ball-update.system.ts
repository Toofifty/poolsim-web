import { ECS, System, type Entity } from '../../../common/ecs';
import { BallMesh } from '../components/ball-mesh';
import type { Game } from '../game';
import { InHand } from '../plugins/gameplay/in-hand.component';
import { Physics } from '../plugins/physics/physics.component';
import { toQuaternion, toVector3 } from '../util/three-interop';

export class BallUpdateSystem extends System<Game> {
  public components: Set<Function> = new Set([Physics, BallMesh]);

  public run(ecs: ECS<any, Game>, entity: Entity): void {
    const [physics, { mesh, material }, inHand] = ecs.get(
      entity,
      Physics,
      BallMesh,
      InHand
    );

    mesh.position.copy(toVector3(physics.r));
    mesh.rotation.setFromQuaternion(toQuaternion(physics.orientation));

    if (inHand && !material.transparent) {
      material.transparent = true;
      material.opacity = 0.5;
      material.needsUpdate = true;
    } else if (!inHand && material.transparent) {
      material.transparent = false;
      material.opacity = 1;
      material.needsUpdate = true;
    }
  }
}
