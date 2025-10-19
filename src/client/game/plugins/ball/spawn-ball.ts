import type { Ctor, ECS, ECSComponent } from '@common/ecs';
import type { Quat, Vec } from '@common/math';
import type { Params } from '@common/simulation/physics';
import { BallId } from '../../components/ball-id';
import { BallMesh } from '../../components/ball-mesh';
import type { GameEvents } from '../../events';
import { settings } from '../../store/settings';
import { Physics } from '../physics/physics.component';
import { Projection } from '../projection/projection.component';
import {
  BallDebugUArrow,
  BallDebugVArrow,
  BallDebugWArrow,
} from './ball-debug-arrow.component';
import { BallRing } from './ball-ring.component';
import { BallTableIndicator } from './ball-table-indicator.component';

type OverrideComponent = [ECSComponent, Ctor<ECSComponent>];

export const spawnBall = (
  ecs: ECS<GameEvents>,
  params: Params,
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
  const physics = Physics.create({
    id,
    r: position,
    R: params.ball.radius,
    orientation,
  });
  return ecs.spawn(
    BallId.create({ id }),
    physics,
    BallMesh.create({ id }),
    BallTableIndicator.create({ radius: params.ball.radius, color }),
    // todo: potentially raise entity create event, dynamically add components after
    ...(settings.debugBalls
      ? [
          BallRing.create(physics),
          [BallDebugUArrow.create(), BallDebugUArrow] as OverrideComponent,
          [BallDebugVArrow.create(), BallDebugVArrow] as OverrideComponent,
          [BallDebugWArrow.create(), BallDebugWArrow] as OverrideComponent,
        ]
      : []),
    Projection.create({ id, radius: params.ball.radius, color })
  );
};
