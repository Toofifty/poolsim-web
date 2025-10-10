import type { ECS } from '../../../common/ecs';
import type { Quat, Vec } from '../../../common/math';
import { BallId } from '../components/ball-id';
import { BallMesh } from '../components/ball-mesh';
import { Object3DComponent } from '../components/mesh';
import { Physics } from '../components/physics';

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
    Physics.create({ r: position }),
    [BallMesh.create({ id }), Object3DComponent]
  );
};
