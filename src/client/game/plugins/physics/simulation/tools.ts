import { PhysicsState } from '../physics.component';
import type { SimulationState } from './step';

export const settled = (state: SimulationState) => {
  return state.balls.every(
    (ball) =>
      ball.state === PhysicsState.Stationary ||
      ball.state === PhysicsState.Pocketed ||
      ball.state === PhysicsState.OutOfPlay
  );
};
