import { vec } from '@common/math';
import { compute } from '@common/math/computed';
import { defaultParams } from '@common/simulation/physics';
import { PhysicsState, type Physics } from '../../../components/physics';
import {
  computeContactVelocity,
  computeIdealAngularVelocity,
  computeRollTime,
  computeSlideTime,
  computeSpinTime,
} from './compute';

export const evolveMotion = (ball: Physics, dt: number) => {
  if (ball.state === PhysicsState.Airborne) {
    evolveVertical(ball, dt);
    return;
  }

  if (ball.state === PhysicsState.Sliding) {
    const slideTime = computeSlideTime(ball);

    if (dt >= slideTime) {
      evolveSlide(ball, slideTime);
      ball.state = PhysicsState.Rolling;
      dt -= slideTime;
    } else {
      evolveSlide(ball, dt);
      return;
    }
  }

  if (ball.state === PhysicsState.Rolling) {
    const rollTime = computeRollTime(ball);

    if (dt >= rollTime) {
      evolveRoll(ball, rollTime);
      ball.state = PhysicsState.Spinning;
      dt -= rollTime;
    } else {
      evolveRoll(ball, dt);
      return;
    }
  }

  if (ball.state === PhysicsState.Spinning) {
    const spinTime = computeSpinTime(ball);

    return evolveSpin(ball, Math.min(dt, spinTime));
  }
};

export const evolveSlide = (ball: Physics, dt: number) => {
  const { gravity: g, frictionSlide: us } = defaultParams.ball;

  const U = computeContactVelocity(ball);
  const dr = compute.deltaRU(ball.v, U, us, g, dt);
  const dv = compute.deltaVU(U, us, g, dt);

  // r += vt + 0.5at²
  vec.madd(ball.r, dr);

  // v += at
  vec.madd(ball.v, dv);

  // Δw = -(5/2R) μ t (u0 × ẑ)
  const dw = compute.deltaW(U, ball.R, us, g, dt);
  const wIdeal = computeIdealAngularVelocity(ball);
  const mw = vec.sub(wIdeal, ball.w);
  if (vec.lenSq(dw) > vec.lenSq(mw)) {
    ball.w[0] = wIdeal[0];
    ball.w[1] = wIdeal[1];
  } else {
    vec.madd(ball.w, dw);
  }

  evolveSpin(ball, dt);
};

export const evolveRoll = (ball: Physics, dt: number) => {
  const { gravity: g, frictionRoll: ur } = defaultParams.ball;

  const deltaR = compute.deltaR(ball.v, ur, g, dt);
  const deltaV = compute.deltaV(ball.v, ur, g, dt);

  // r += vt - 0.5at²
  vec.madd(ball.r, deltaR);

  if (vec.lenSq(deltaV) > vec.lenSq(ball.v)) {
    // |a| > |v| -> set velocity to 0
    vec.mcopy(ball.v, vec.zero);
  } else {
    // v += at
    vec.madd(ball.v, deltaV);
  }

  // align w with v
  const wXY = computeIdealAngularVelocity(ball);
  ball.w[0] = wXY[0];
  ball.w[1] = wXY[1];

  evolveSpin(ball, dt);
};

export const evolveSpin = (ball: Physics, dt: number) => {
  const { gravity: g, frictionSpin: usp } = defaultParams.ball;

  const wz = ball.w[2];
  if (Math.abs(wz) < 1e-12) return;

  const alpha = (5 * usp * g) / (2 * ball.R);

  const maxT = Math.abs(wz) / alpha;
  const t = Math.min(dt, maxT);

  const sign = wz > 0 ? 1 : -1;
  ball.w[2] = wz - sign * alpha * t;
};

export const evolveVertical = (ball: Physics, dt: number) => {
  const { gravity: g } = defaultParams.ball;

  // todo: air resistance
  const accel = vec.new(0, 0, -g);
  // r += vt + 0.5at²
  vec.madd(
    ball.r,
    vec.add(vec.mult(ball.v, dt), vec.mult(accel, 0.5 * dt * dt))
  );

  // v += at
  vec.madd(ball.v, vec.mult(accel, dt));
};
