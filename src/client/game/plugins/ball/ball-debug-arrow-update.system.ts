import { ECS, System, type Entity } from '@common/ecs';
import { vec } from '@common/math';
import { toVector3 } from '../../util/three-interop';
import { computeContactVelocity } from '../physics/evolution/compute';
import { Physics } from '../physics/physics.component';
import {
  BallDebugUArrow,
  BallDebugVArrow,
  BallDebugWArrow,
} from './ball-debug-arrow.component';

export class BallDebugUArrowUpdateSystem extends System {
  public components: Set<Function> = new Set([Physics, BallDebugUArrow]);

  public run(ecs: ECS<any, unknown>, entity: Entity): void {
    const [ball, arrow] = ecs.get(entity, Physics, BallDebugUArrow);

    arrow.mesh.position.copy(toVector3(vec.setZ(ball.r, 0)));
    arrow.setVector(vec.neg(computeContactVelocity(ball)));
  }
}

export class BallDebugVArrowUpdateSystem extends System {
  public components: Set<Function> = new Set([Physics, BallDebugVArrow]);

  public run(ecs: ECS<any, unknown>, entity: Entity): void {
    const [ball, arrow] = ecs.get(entity, Physics, BallDebugVArrow);

    arrow.mesh.position.copy(toVector3(ball.r));
    arrow.setVector(ball.v);
  }
}

export class BallDebugWArrowUpdateSystem extends System {
  public components: Set<Function> = new Set([Physics, BallDebugWArrow]);

  public run(ecs: ECS<any, unknown>, entity: Entity): void {
    const [ball, arrow] = ecs.get(entity, Physics, BallDebugWArrow);

    arrow.mesh.position.copy(toVector3(ball.r));
    arrow.setVector(ball.w);
  }
}
