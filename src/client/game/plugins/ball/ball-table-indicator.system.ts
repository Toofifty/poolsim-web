import { ECS, System, type Entity } from '@common/ecs';
import { vec } from '@common/math';
import { toVector3 } from '../../util/three-interop';
import { Physics } from '../physics/physics.component';
import { BallTableIndicator } from './ball-table-indicator.component';

export class BallTableIndicatorSystem extends System {
  public components: Set<Function> = new Set([Physics, BallTableIndicator]);

  public run(ecs: ECS<any, unknown>, entity: Entity): void {
    const [ball, indicator] = ecs.get(entity, Physics, BallTableIndicator);
    if (ball.r[2] > ball.R + 0.01) {
      // 0.01 prevents z fighting
      const pos = vec.setZ(ball.r, 0.01);
      indicator.mesh.position.copy(toVector3(pos));
      indicator.mesh.visible = true;
    } else {
      indicator.mesh.visible = false;
    }
  }
}
