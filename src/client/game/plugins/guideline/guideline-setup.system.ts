import { createStartupSystem } from '@common/ecs/func';
import { ArrowMesh } from '../../components/arrow-mesh.component';
import { ImpactArrow } from '../../components/arrow-type.component';
import { LineMesh } from '../../components/line-mesh.component';
import type { GameEvents } from '../../events';
import { Guideline } from './guideline.component';
import { ImpactPointMesh } from './impact-point-mesh.component';

export const setupGuidelines = createStartupSystem<GameEvents>((ecs) => {
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
});

export const destroyGuidelines = createStartupSystem<GameEvents>((ecs) => {
  ecs.queryAll(Guideline).forEach((entity) => ecs.removeEntity(entity));
  ecs.queryAll(ImpactArrow).forEach((entity) => ecs.removeEntity(entity));
});
