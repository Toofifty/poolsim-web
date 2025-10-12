import { vec } from '@common/math';
import { PhysicsState } from '../physics.component';
import type { SimulationState } from './state';

export const settled = (state: SimulationState) => {
  return state.balls.every(
    (ball) =>
      ball.state === PhysicsState.Stationary ||
      ball.state === PhysicsState.OutOfPlay ||
      (ball.state === PhysicsState.Pocketed &&
        vec.isZero(ball.v) &&
        vec.isZero(ball.w))
  );
};
