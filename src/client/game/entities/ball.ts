import type { ECS } from '../../../common/ecs';
import { BallId } from '../components/ball-id';
import { Physics } from '../components/physics';

export const spawnBall = (ecs: ECS) => {
  return ecs.createAndSpawn(BallId.create(), Physics.create());
};
