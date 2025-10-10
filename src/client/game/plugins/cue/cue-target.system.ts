import { ECS, System, type Entity } from '@common/ecs';
import { vec } from '@common/math';
import { BallId } from '../../components/ball-id';
import { PlayState } from '../../controller/game-controller';
import { SystemState } from '../../resources/system-state';
import { MousePosition } from '../mouse/mouse-position.resource';
import { Physics } from '../physics/physics.component';
import { Cue } from './cue.component';

export class CueTargetSystem extends System {
  public components: Set<Function> = new Set([Cue]);

  public run(ecs: ECS<any, unknown>, entity: Entity): void {
    const systemState = ecs.resource(SystemState);
    if (systemState.playState !== PlayState.PlayerShoot) {
      return;
    }

    const [cue] = ecs.get(entity, Cue);
    cue.targetEntity = ecs.query().has(BallId, Physics).findOne();
    if (cue.targetEntity === undefined) {
      return;
    }

    const [ball] = ecs.get(cue.targetEntity, Physics);
    vec.mcopy(cue.target, ball.r);

    const mouse = ecs.resource(MousePosition);
    cue.angle = vec.angle2D(cue.target, mouse.world);
  }
}
