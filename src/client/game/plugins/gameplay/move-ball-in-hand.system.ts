import { ECS, System, type Entity } from '@common/ecs';
import { vec } from '@common/math';
import { constrain, warn } from '@common/util';
import type { GameEvents } from '../../events';
import { SystemState } from '../../resources/system-state';
import { MousePosition } from '../mouse/mouse-position.resource';
import { Physics } from '../physics/physics.component';
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
    const { isBreak, params } = ecs.resource(SystemState);
    const table = params.table;

    // run a few relaxation iterations (helps resolve multiple overlaps)
    for (let i = 0; i < 5; i++) {
      let corrected = false;

      const balls = ecs.query().resolveAll(Physics);
      for (const other of balls) {
        if (other.id === ball.id) continue;
        const oPos = vec.setZ(other.r, 0);
        const diff = vec.sub(target, oPos);
        const dist = vec.len(diff);
        const minDist = ball.R + other.R;
        if (dist < minDist && dist > 0.0001) {
          const push = vec.mult(vec.norm(diff), minDist - dist);
          vec.madd(target, push);
          corrected = true;
        }
      }

      // --- clamp within bounds ---
      const preconstrain = vec.clone(target);
      target[0] = constrain(
        target[0],
        -table.length / 2 + ball.R + params.cushion.width,
        table.length / 2 - ball.R - params.cushion.width
      );
      target[1] = constrain(
        target[1],
        -table.width / 2 + ball.R + params.cushion.width,
        table.width / 2 - ball.R - params.cushion.width
      );

      if (isBreak && ball.id === 0) {
        target[0] = Math.min(target[0], -table.length / 4);
      }

      corrected ||= !vec.eq(preconstrain, target);

      if (!corrected) break;
    }

    vec.mcopy(ball.r, target);
    vec.msetZ(ball.r, 0.1 + 0.01 * Math.sin(ecs.frameId / 200));

    ecs.emit('game/move-ball-in-hand', {
      id: ball.id,
      position: ball.r,
    });
  }
}
