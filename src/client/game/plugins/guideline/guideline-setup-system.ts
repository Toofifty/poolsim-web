import { ECS, StartupSystem } from '@common/ecs';
import { ArrowMesh } from '../../components/arrow-mesh.component';
import { ImpactArrow } from '../../components/arrow-type.component';
import { LineMesh } from '../../components/line-mesh.component';
import { Guideline } from './guideline.component';
import { ImpactPointMesh } from './impact-point-mesh.component';

export class GuidelineSetupSystem extends StartupSystem {
  public run(ecs: ECS): void {
    // guideline
    ecs.spawnImmediate(
      Guideline.create(),
      LineMesh.create(),
      ImpactPointMesh.create()
    );

    // impact arrows
    ecs.spawnImmediate(
      ImpactArrow.create({ kind: 'cue-ball' }),
      ArrowMesh.create({ scale: 0.2 })
    );
    ecs.spawnImmediate(
      ImpactArrow.create({ kind: 'object-ball' }),
      ArrowMesh.create({ scale: 0.2 })
    );
  }
}
