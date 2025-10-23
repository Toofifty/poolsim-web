import type { ECS, Entity } from '@common/ecs';
import type { GameEvents } from '../../events';
import { Physics, PhysicsState } from '../physics/physics.component';

export const getActiveBallIds = (
  ecs: ECS<GameEvents>,
  entities?: Set<Entity>
) => {
  const ballEntities = (
    entities ? [...entities] : ecs.query().has(Physics).findAll()
  ).splice(1);

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
