import { iteration, pairs } from '@common/util/iterate';
import type { Pocket } from '../../table/pocket.component';
import type { Collider } from '../collider.component';
import { PhysicsState, type Physics } from '../physics.component';

// todo: include break status
export type SimulationState = {
  /** All balls */
  balls: Physics[];
  /** All pockets */
  pockets: Pocket[];
  /** Pairs of active balls */
  pairs: [Physics, Physics][];
  /** Pairs of active balls -> colliders */
  ballColliders: [Physics, Collider][];
  /** Pairs of active balls -> pockets */
  ballPockets: [Physics, Pocket][];
};

const isActive = (ball: Physics) =>
  // todo: check ball out of bounds
  ball.state !== PhysicsState.Pocketed && ball.state !== PhysicsState.OutOfPlay;

/**
 * Precompute ball/cushion/pocket pairs required for simulation
 */
export const createSimulationState = (
  balls: Physics[],
  colliders: Collider[],
  pockets: Pocket[],
  { cueBallOnly }: { cueBallOnly?: boolean } = {}
): SimulationState => {
  const activeBalls = balls.filter(isActive);
  const activeTargetBalls = cueBallOnly ? balls.slice(1).filter(isActive) : [];

  return {
    balls: cueBallOnly ? [balls[0]] : balls,
    pockets,
    pairs: cueBallOnly
      ? iteration([balls[0]], activeTargetBalls)
      : pairs(activeBalls),
    ballColliders: cueBallOnly
      ? iteration([balls[0]], colliders)
      : iteration(activeBalls, colliders),
    ballPockets: cueBallOnly
      ? iteration([balls[0]], pockets)
      : iteration(activeBalls, pockets),
  };
};
