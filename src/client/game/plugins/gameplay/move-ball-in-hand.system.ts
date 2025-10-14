import { ECS, System, type Entity } from '@common/ecs';
import { vec } from '@common/math';
import { warn } from '@common/util';
import type { GameEvents } from '../../events';
import { SystemState } from '../../resources/system-state';
import { MousePosition } from '../mouse/mouse-position.resource';
import { Physics } from '../physics/physics.component';
import { Cushion } from '../table/cushion.component';
import { Pocket } from '../table/pocket.component';
import { InHand } from './in-hand.component';

export class MoveBallInHandSystem extends System {
  public components: Set<Function> = new Set([InHand]);

  public before(ecs: ECS<GameEvents>, entities: Set<Entity>): boolean {
    warn(entities.size > 1, 'More than 1 entity has InHand component');
    return entities.size <= 1;
  }

  public run(ecs: ECS<GameEvents>, entity: Entity): void {
    const mouse = ecs.resource(MousePosition);
    const [ball, inHand] = ecs.get(entity, Physics, InHand);
    if (inHand.animating) return;

    const target = vec.setZ(mouse.world, 0);

    const balls = ecs.query().resolveAll(Physics);
    balls.forEach((other) => {
      if (other.id === ball.id) return;

      const dist = vec.dist(target, vec.setZ(other.r, 0));
      if (dist < ball.R + other.R) {
        const normal = vec.norm(vec.sub(ball.r, other.r));
        const overlap = ball.R + other.R - dist;
        const correction = vec.mult(normal, overlap * 10);
        vec.madd(target, correction);
      }
    });

    const cushions = ecs.query().resolveAll(Cushion);
    const collidingCushion = cushions.some((cushion) => {
      const closestPoint = Cushion.findClosestPoint(cushion, target);
      return vec.dist(vec.setZ(closestPoint, 0), target) < ball.R;
    });

    const pockets = ecs.query().resolveAll(Pocket);
    const collidingPocket = pockets.some(
      (pocket) => vec.dist(vec.setZ(pocket.position, 0), target) < pocket.radius
    );

    const { isBreak, params } = ecs.resource(SystemState);
    const outOfBounds =
      target[0] < -params.table.length / 2 ||
      target[0] > params.table.length / 2 ||
      target[1] < -params.table.width / 2 ||
      target[1] > params.table.width / 2;

    const outOfBoundsOnBreak =
      isBreak && ball.id === 0 ? target[0] > -params.table.length / 4 : false;

    if (
      collidingCushion ||
      collidingPocket ||
      outOfBounds ||
      outOfBoundsOnBreak
    ) {
      return;
    }

    vec.mcopy(ball.r, mouse.world);
    vec.msetZ(ball.r, 0.1 + 0.01 * Math.sin(ecs.frameId / 200));

    ecs.emit('game/move-ball-in-hand', {
      id: ball.id,
      position: ball.r,
    });
  }
}
