import { ECS, System, type Entity } from '@common/ecs';
import { vec } from '@common/math';
import type { GameEvents } from '../../events';
import { SystemState } from '../../resources/system-state';
import { maybeFindBallById } from '../gameplay/find-ball-by-id';
import { InHand } from '../gameplay/in-hand.component';
import { MousePosition } from '../mouse/mouse-position.resource';
import { Cue } from './cue.component';

export class CueTargetSystem extends System {
  public components: Set<Function> = new Set([Cue]);

  public run(ecs: ECS<GameEvents, unknown>, entity: Entity): void {
    const system = ecs.resource(SystemState);
    if (!system.isShootable || !system.isActivePlayer) return;

    const ballInHandEntity = ecs.query().has(InHand).findOne();
    if (ballInHandEntity !== undefined) return;

    const [cue] = ecs.get(entity, Cue);
    if (cue.targetId === undefined || cue.shooting || cue.locked) {
      return;
    }

    const [_, ball] = maybeFindBallById(ecs, cue.targetId);
    if (!ball) return;
    vec.mcopy(cue.target, ball.r);

    const mouse = ecs.resource(MousePosition);
    // only update cue if cursor is not too close
    if (vec.dist(cue.target, mouse.world) > ball.R * 2) {
      cue.angle = vec.angle2D(cue.target, mouse.world);
    }

    ecs.emit('game/cue-update', cue);
  }
}
