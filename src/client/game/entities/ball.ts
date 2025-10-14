import { defaultParams } from '@common/simulation/physics';
import type { ECS } from '../../../common/ecs';
import type { Quat, Vec } from '../../../common/math';
import { BallId } from '../components/ball-id';
import { BallMesh } from '../components/ball-mesh';
import { BallTableIndicator } from '../plugins/ball/ball-table-indicator.component';
import { Physics } from '../plugins/physics/physics.component';

export const spawnBall = (
  ecs: ECS,
  {
    id,
    position,
    color,
    orientation,
  }: {
    id: number;
    number: number;
    color: number;
    position: Vec;
    orientation: Quat;
  }
) => {
  return ecs.spawn(
    BallId.create({ id }),
    Physics.create({
      id,
      r: position,
      R: defaultParams.ball.radius,
      orientation,
    }),
    BallMesh.create({ id }),
    BallTableIndicator.create({ radius: defaultParams.ball.radius, color })
  );
};
