import { constrain } from '@common/util';
import { ECS, System, type Entity } from '../../../common/ecs';
import { BallMesh } from '../components/ball-mesh';
import type { Game } from '../game';
import { InHand } from '../plugins/gameplay/in-hand.component';
import { OldPhysics, Physics } from '../plugins/physics/physics.component';
import { SystemState } from '../resources/system-state';
import { toQuaternion, toVector3 } from '../util/three-interop';

export class BallUpdateSystem extends System<Game> {
  public components: Set<Function> = new Set([Physics, BallMesh]);

  private now = performance.now();
  private shouldLerp = false;

  public before(ecs: ECS<any, Game>, entities: Set<Entity>): boolean {
    // we render the state at the _last_ physics frame, that way
    // we can interpolate to the new physics frame over time
    const params = ecs.resource(SystemState).params;
    this.shouldLerp = params.simulation.playbackSpeed < 1;
    if (this.shouldLerp) {
      this.now =
        performance.now() -
        1000 /
          params.simulation.updatesPerSecond /
          params.simulation.playbackSpeed;
    }
    return true;
  }

  public run(ecs: ECS<any, Game>, entity: Entity): void {
    const [physics, oldPhysics, { mesh, material }, inHand] = ecs.get(
      entity,
      Physics,
      OldPhysics,
      BallMesh,
      InHand
    );

    if (this.shouldLerp) {
      const t0 = oldPhysics.ts;
      const t1 = physics.ts;
      const alpha = constrain((this.now - t0) / (t1 - t0), 0, 1);

      mesh.position
        .copy(toVector3(oldPhysics.r))
        .lerp(toVector3(physics.r), alpha);
      mesh.quaternion
        .copy(toQuaternion(oldPhysics.orientation))
        .slerp(toQuaternion(physics.orientation), alpha);
    } else {
      mesh.position.copy(toVector3(physics.r));
      mesh.quaternion.copy(toQuaternion(physics.orientation));
    }

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
