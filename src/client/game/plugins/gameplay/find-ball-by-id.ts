import type { ECS } from '@common/ecs';
import { assertExists } from '@common/util';
import type { GameEvents } from '../../events';
import { Physics } from '../physics/physics.component';

export const findBallById = (ecs: ECS<GameEvents>, id: number) => {
  const ballEntities = ecs.queryAll(Physics);
  const [entity, ball] =
    ballEntities
      .map((entity) => [entity, ecs.get(entity, Physics)[0]] as const)
      .find(([_, ball]) => ball.id === id) ?? [];
  assertExists(entity, `Failed to find entity with ball id ${id}`);
  assertExists(ball, `Failed to find physics of ball id ${id}`);
  return [entity, ball] as const;
};

export const maybeFindBallById = (ecs: ECS<GameEvents>, id: number) => {
  const ballEntities = ecs.queryAll(Physics);
  const [entity, ball] =
    ballEntities
      .map((entity) => [entity, ecs.get(entity, Physics)[0]] as const)
      .find(([_, ball]) => ball.id === id) ?? [];
  return [entity, ball] as const;
};
