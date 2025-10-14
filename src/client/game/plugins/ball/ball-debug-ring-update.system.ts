import { ECS, System, type Entity } from '@common/ecs';
import { toVector3 } from '../../util/three-interop';
import { getColor } from '../guideline/guideline-update.system';
import { Physics } from '../physics/physics.component';
import { BallRing } from './ball-ring.component';

export class BallDebugRingUpdateSystem extends System {
  public components: Set<Function> = new Set([Physics, BallRing]);

  public run(ecs: ECS<any, unknown>, entity: Entity): void {
    const [ball, { ring, material }] = ecs.get(entity, Physics, BallRing);

    ring.position.copy(toVector3(ball.r));
    material.color = getColor(ball.state);
  }
}
