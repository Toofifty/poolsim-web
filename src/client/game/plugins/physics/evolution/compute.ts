import { vec, type Vec } from '@common/math';
import { compute } from '@common/math/computed';
import { defaultParams } from '@common/simulation/physics';
import { PhysicsState, type Physics } from '../physics.component';

export const computeMomentaryFrictionAccel = (ball: Physics): Vec => {
  const {
    gravity: g,
    frictionSlide: us,
    frictionRoll: ur,
  } = defaultParams.ball;

  if (ball.state === PhysicsState.Sliding) {
    const u0 = vec.norm(computeContactVelocity(ball));
    return vec.mult(u0, -us * g);
  }

  if (ball.state === PhysicsState.Rolling) {
    const vh = vec.norm(ball.v);
    return vec.mult(vh, -ur * g);
  }

  return vec.zero;
};

export const computeMomentaryFrictionDelta = (
  ball: Physics,
  dt: number
): Vec => {
  return vec.mult(computeMomentaryFrictionAccel(ball), dt);
};

export const computeContactVelocity = (ball: Physics): Vec => {
  if (ball.state === PhysicsState.Pocketed) return vec.zero;

  return vec.mminimise(compute.contactVelocity(ball.v, ball.w, ball.R));
};

export const computeIdealAngularVelocity = (ball: Physics): Vec => {
  return vec.msetZ(compute.idealW(ball.v, ball.R), ball.w[2]);
};

export const computeSlideTime = (ball: Physics): number => {
  if (defaultParams.ball.frictionSlide === 0) {
    return Infinity;
  }

  return (
    (2 * vec.len(computeContactVelocity(ball))) /
    (7 * defaultParams.ball.frictionSlide)
  );
};

export const computeRollTime = (ball: Physics): number => {
  if (defaultParams.ball.frictionRoll === 0) {
    return Infinity;
  }

  return vec.len(ball.v) / defaultParams.ball.frictionRoll;
};

export const computeSpinTime = (ball: Physics): number => {
  if (defaultParams.ball.frictionSpin === 0) {
    return Infinity;
  }

  return Math.abs(ball.w[2]) * 0.4 * (ball.R / defaultParams.ball.frictionSpin);
};

export const computeAirTime = (ball: Physics): number => {
  if (ball.r[2] <= 0 && ball.v[2] <= 0) {
    return 0;
  }

  const disc =
    ball.v[2] * ball.v[2] + 2 * defaultParams.ball.gravity * ball.r[2];
  if (disc < 0) return 0;

  return ball.v[2] + Math.sqrt(disc) / defaultParams.ball.gravity;
};
