import type { ECS, Entity } from '@common/ecs';
import { Pocket } from '../table/pocket.component';
import { Collider } from './collider.component';
import { Physics } from './physics.component';
import { createSimulationState } from './simulation/state';

export const prepareSimulation = (
  ecs: ECS<any, unknown>,
  opts: { cueBallOnly?: boolean; ballEntities?: Set<Entity> } = {}
) => {
  const ballEntities = opts.ballEntities
    ? [...opts.ballEntities]
    : ecs.query().has(Physics).findAll();
  const balls = [...ballEntities]
    .map((entity) => ecs.get(entity, Physics))
    .flat();
  const colliders = ecs.query().resolveAll(Collider);
  const pockets = ecs.query().resolveAll(Pocket);

  return createSimulationState(balls, colliders, pockets, opts);
};
