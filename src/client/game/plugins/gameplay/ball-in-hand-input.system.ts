import { ECS, EventSystem } from '@common/ecs';
import { vec } from '@common/math';
import type { GameEvents } from '../../events';
import { SystemState } from '../../resources/system-state';
import { settings } from '../../store/settings';
import { MousePosition } from '../mouse/mouse-position.resource';
import { Physics, PhysicsState } from '../physics/physics.component';
import { InHand } from './in-hand.component';

export class BallInHandInputSystem extends EventSystem<
  'input/mouse-pressed',
  GameEvents
> {
  public event = 'input/mouse-pressed' as const;

  public async run(
    ecs: ECS<GameEvents, unknown>,
    data: GameEvents['input/mouse-pressed']
  ): Promise<void> {
    const system = ecs.resource(SystemState);
    if (!system.isActivePlayer) return;

    const mouse = ecs.resource(MousePosition);

    const ballInHandEntity = ecs.query().has(InHand).findOne();

    if (data.button === 0 && ballInHandEntity !== undefined) {
      const [ball] = ecs.get(ballInHandEntity, Physics);
      ecs.emit('game/place-ball', { id: ball.id, position: ball.r });
      return;
    }

    // todo: check settings / ball in hand state
    if (
      data.button === 2 &&
      ballInHandEntity === undefined &&
      (settings.enableBallPickup || system.canPickupCueBall)
    ) {
      const target = vec.setZ(mouse.world, 0);

      const ballEntities = ecs.query().has(Physics).findAll();
      let closestEntity: number | undefined = undefined;
      let closestBall: Physics | undefined = undefined;
      let closestDist = Infinity;
      for (const ballEntity of ballEntities) {
        const [ball] = ecs.get(ballEntity, Physics);
        if (ball.state !== PhysicsState.Stationary) {
          continue;
        }

        const dist = vec.distSq(ball.r, target);
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
        ecs.emit('game/pickup-ball', { id: closestBall.id });
      }
    }
  }
}
