import { iteration, pairs } from '@common/util/iterate';
import type { Cushion } from '../../table/cushion.component';
import type { Pocket } from '../../table/pocket.component';
import { PhysicsState, type Physics } from '../physics.component';

// todo: include break status
export type SimulationState = {
  /** All balls */
  balls: Physics[];
  /** All pockets */
  pockets: Pocket[];
  /** Pairs of active balls */
  pairs: [Physics, Physics][];
  /** Pairs of active balls -> cushions */
  ballCushions: [Physics, Cushion][];
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
  cushions: Cushion[],
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
    ballCushions: cueBallOnly
      ? iteration([balls[0]], cushions)
      : iteration(activeBalls, cushions),
    ballPockets: cueBallOnly
      ? iteration([balls[0]], pockets)
      : iteration(activeBalls, pockets),
  };
};
