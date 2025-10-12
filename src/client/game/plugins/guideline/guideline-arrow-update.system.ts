import { ECS, System, type Entity } from '@common/ecs';
import { ArrowMesh } from '../../components/arrow-mesh.component';
import { ImpactArrow } from '../../components/arrow-type.component';
import { PlayState } from '../../controller/game-controller';
import { SystemState } from '../../resources/system-state';
import { toVector3 } from '../../util/three-interop';
import { Cue } from '../cue/cue.component';
import { Guideline } from './guideline.component';

export class GuidelineArrowUpdateSystem extends System {
  public components: Set<Function> = new Set([ImpactArrow, ArrowMesh]);

  public run(ecs: ECS<any, unknown>, entity: Entity): void {
    const [{ kind }, arrow] = ecs.get(entity, ImpactArrow, ArrowMesh);
    const guideline = ecs.query().resolveFirst(Guideline);
    const systemState = ecs.resource(SystemState);
    if (
      systemState.playState !== PlayState.PlayerShoot ||
      (guideline.trackingPoints.length === 0 && !guideline.computing) ||
      ecs.query().resolveFirst(Cue).shooting
    ) {
      arrow.mesh.visible = false;
      return;
    }

    if (kind === 'cue-ball') {
      if (
        !guideline.cueBallVelocity ||
        !guideline.collisionPoint ||
        guideline.invalid
      ) {
        arrow.mesh.visible = false;
      } else {
        arrow.mesh.position.copy(toVector3(guideline.collisionPoint.position));
        arrow.setVector(guideline.cueBallVelocity);
      }
    } else if (kind === 'object-ball') {
      if (
        !guideline.targetBallVelocity ||
        !guideline.targetBallPosition ||
        guideline.invalid
      ) {
        arrow.mesh.visible = false;
      } else {
        arrow.mesh.position.copy(toVector3(guideline.targetBallPosition));
        arrow.setVector(guideline.targetBallVelocity);
      }
    }
  }
}
