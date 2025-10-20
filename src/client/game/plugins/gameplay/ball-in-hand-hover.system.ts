import { ECS, System } from '@common/ecs';
import { vec } from '@common/math';
import type { GameEvents } from '../../events';
import { SystemState } from '../../resources/system-state';
import { settings } from '../../store/settings';
import { MousePosition } from '../mouse/mouse-position.resource';
import { Physics, PhysicsState } from '../physics/physics.component';
import { InHand } from './in-hand.component';

export class BallInHandHoverSystem extends System {
  public components: Set<Function> = new Set([]);

  public run(ecs: ECS<GameEvents, unknown>): void {
    const system = ecs.resource(SystemState);
    if (!system.isActivePlayer) return;

    const ballInHandEntity = ecs.query().has(InHand).findOne();
    if (ballInHandEntity !== undefined) {
      if (document.body.style.cursor !== 'grabbing') {
        document.body.style.cursor = 'grabbing';
      }
      return;
    }

    const mouse = ecs.resource(MousePosition);

    const ballEntities = ecs.query().has(Physics).findAll();
    let closestEntity: number | undefined = undefined;
    let closestBall: Physics | undefined = undefined;
    let closestDist = Infinity;
    for (const ballEntity of ballEntities) {
      const [ball] = ecs.get(ballEntity, Physics);
      if (ball.state !== PhysicsState.Stationary) {
        continue;
      }

      const dist = vec.distSq(vec.subZ(ball.r, ball.R), mouse.world);
      if (dist < ball.R * ball.R && dist < closestDist) {
        closestEntity = ballEntity;
        closestBall = ball;
        closestDist = dist;
      }
    }

    if (
      closestEntity !== undefined &&
      closestBall !== undefined &&
      ((closestBall.id === 0 && system.canPickupCueBall) ||
        settings.enableBallPickup)
    ) {
      if (document.body.style.cursor !== 'grab') {
        document.body.style.cursor = 'grab';
      }
      return;
    }

    if (document.body.style.cursor !== '') {
      document.body.style.cursor = '';
    }
  }
}
