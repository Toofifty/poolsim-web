import { defaultParams } from '@common/simulation/physics';
import type { ECS } from '../../../common/ecs';
import type { Quat, Vec } from '../../../common/math';
import { BallId } from '../components/ball-id';
import { BallMesh } from '../components/ball-mesh';
import { Renderable } from '../components/renderable';
import { Physics } from '../plugins/physics/physics.component';

export const spawnBall = (
  ecs: ECS,
  {
    id,
    position,
  }: {
    id: number;
    number: number;
    color: number;
    position: Vec;
    orientation: Quat;
  }
) => {
  return ecs.createAndSpawn(
    BallId.create({ id }),
    Physics.create({ id, r: position, R: defaultParams.ball.radius }),
    [BallMesh.create({ id }), Renderable]
  );
};
