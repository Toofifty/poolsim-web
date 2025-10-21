import { ECS, System } from '@common/ecs';
import { vec } from '@common/math';
import { dlerp } from '../../dlerp';
import type { GameEvents } from '../../events';
import { SystemState } from '../../resources/system-state';
import { settings } from '../../store/settings';
import { MousePosition } from '../mouse/mouse-position.resource';
import { Physics, PhysicsState } from '../physics/physics.component';
import { InHand } from './in-hand.component';

const LIFT = 0.0125;
const LIFT_TIME = 50;

export class BallInHandHoverSystem extends System {
  public components: Set<Function> = new Set([]);

  private currentHovered?: Physics;

  public async run(ecs: ECS<GameEvents, unknown>): Promise<void> {
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

    if (this.currentHovered !== undefined) {
      const ball = this.currentHovered;
      const dist = vec.distSq(vec.subZ(ball.r, ball.R), mouse.world);
      if (dist < ball.R * ball.R) {
        return;
      }
      dlerp((v) => vec.msetZ(ball.r, v), ball.r[2] + LIFT, ball.R, LIFT_TIME);
      this.currentHovered = undefined;
    }

    const ballEntities = ecs.query().has(Physics).findAll();
    let closestEntity: number | undefined = undefined;
    let closestBall: Physics | undefined = undefined;
    let closestDist = Infinity;
    for (const ballEntity of ballEntities) {
      const [ball] = ecs.get(ballEntity, Physics);
      if (ball.state !== PhysicsState.Stationary) {
        continue;
      }

      const dist = vec.distSq(vec.setZ(ball.r, 0), mouse.world);
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
      dlerp(
        (v) => vec.msetZ(closestBall.r, v),
        closestBall.r[2],
        closestBall.R + LIFT,
        LIFT_TIME
      );
      this.currentHovered = closestBall;
      return;
    }

    if (document.body.style.cursor !== '') {
      document.body.style.cursor = '';
    }
  }
}
