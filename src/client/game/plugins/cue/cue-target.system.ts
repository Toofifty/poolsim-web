import { ECS, System, type Entity } from '@common/ecs';
import { vec } from '@common/math';
import { BallId } from '../../components/ball-id';
import type { GameEvents } from '../../events';
import { GameState, SystemState } from '../../resources/system-state';
import { InHand } from '../gameplay/in-hand.component';
import { MousePosition } from '../mouse/mouse-position.resource';
import { Physics } from '../physics/physics.component';
import { Cue } from './cue.component';

export class CueTargetSystem extends System {
  public components: Set<Function> = new Set([Cue]);

  public run(ecs: ECS<GameEvents, unknown>, entity: Entity): void {
    const systemState = ecs.resource(SystemState);
    if (systemState.gameState !== GameState.Shooting) {
      return;
    }
    const ballInHandEntity = ecs.query().has(InHand).findOne();
    if (ballInHandEntity !== undefined) return;

    const [cue] = ecs.get(entity, Cue);
    cue.targetEntity = ecs.query().has(BallId, Physics).findOne();
    if (cue.targetEntity === undefined || cue.shooting || cue.locked) {
      return;
    }

    const [ball] = ecs.get(cue.targetEntity, Physics);
    vec.mcopy(cue.target, ball.r);

    const mouse = ecs.resource(MousePosition);
    cue.angle = vec.angle2D(cue.target, mouse.world);

    ecs.emit('game/cue-update', cue);
  }
}
