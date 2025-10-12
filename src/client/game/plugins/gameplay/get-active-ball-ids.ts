import type { ECS, Entity } from '@common/ecs';
import { Physics, PhysicsState } from '../physics/physics.component';

export const getActiveBallIds = (ecs: ECS, entities?: Set<Entity>) => {
  const ballEntities = entities
    ? [...entities].splice(1)
    : ecs.query().has(Physics).findAll();

  const active: number[] = [];
  for (const entity of ballEntities) {
    const [physics] = ecs.get(entity, Physics);
    if (
      physics.state !== PhysicsState.Pocketed &&
      physics.state !== PhysicsState.OutOfPlay
    ) {
      active.push(physics.id);
    }
  }

  return active;
};
