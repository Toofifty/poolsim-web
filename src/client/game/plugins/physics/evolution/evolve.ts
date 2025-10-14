import { quat, vec } from '@common/math';
import { compute } from '@common/math/computed';
import { type Params } from '@common/simulation/physics';
import type { Pocket } from '../../table/pocket.component';
import { PhysicsState, type Physics } from '../physics.component';
import {
  computeContactVelocity,
  computeIdealAngularVelocity,
  computeRollTime,
  computeSlideTime,
  computeSpinTime,
} from './compute';

export const evolveMotion = (params: Params, ball: Physics, dt: number) => {
  collideWithSlate(params, ball);

  if (
    ball.state === PhysicsState.Airborne ||
    ball.state === PhysicsState.OutOfPlay
  ) {
    evolveVertical(params, ball, dt);
    return;
  }

  if (ball.state === PhysicsState.Sliding) {
    const slideTime = computeSlideTime(params, ball);

    if (dt >= slideTime) {
      evolveSlide(params, ball, slideTime);
      ball.state = PhysicsState.Rolling;
      dt -= slideTime;
    } else {
      evolveSlide(params, ball, dt);
      return;
    }
  }

  if (ball.state === PhysicsState.Rolling) {
    const rollTime = computeRollTime(params, ball);

    if (dt >= rollTime) {
      evolveRoll(params, ball, rollTime);
      ball.state = PhysicsState.Spinning;
      dt -= rollTime;
    } else {
      evolveRoll(params, ball, dt);
      return;
    }
  }

  if (ball.state === PhysicsState.Spinning) {
    const spinTime = computeSpinTime(params, ball);

    if (dt >= spinTime) {
      evolveSpin(params, ball, spinTime);
      ball.state = PhysicsState.Stationary;
      // dt -= spinTime;
    } else {
      evolveSpin(params, ball, dt);
      return;
    }
  }
};

const evolveSlide = (params: Params, ball: Physics, dt: number) => {
  const { gravity: g, frictionSlide: us } = params.ball;

  const U = computeContactVelocity(ball);
  const dr = compute.deltaRU(ball.v, U, us, g, dt);
  const dv = compute.deltaVU(U, us, g, dt);

  // r += vt + 0.5at²
  vec.madd(ball.r, dr);

  if (ball.r[2] > 0) {
    ball.state = PhysicsState.Airborne;
  }

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

  evolveSpin(params, ball, dt);
};

const evolveRoll = (params: Params, ball: Physics, dt: number) => {
  const { gravity: g, frictionRoll: ur } = params.ball;

  const deltaR = compute.deltaR(ball.v, ur, g, dt);
  const deltaV = compute.deltaV(ball.v, ur, g, dt);

  // r += vt - 0.5at²
  vec.madd(ball.r, deltaR);

  if (ball.r[2] > 0) {
    ball.state = PhysicsState.Airborne;
  }

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

  evolveSpin(params, ball, dt);
};

const evolveSpin = (params: Params, ball: Physics, dt: number) => {
  const { gravity: g, frictionSpin: usp } = params.ball;

  const wz = ball.w[2];
  if (Math.abs(wz) < 1e-12) return;

  const alpha = (5 * usp * g) / (2 * ball.R);

  const maxT = Math.abs(wz) / alpha;
  const t = Math.min(dt, maxT);

  const sign = wz > 0 ? 1 : -1;
  ball.w[2] = wz - sign * alpha * t;
};

export const evolveVertical = (params: Params, ball: Physics, dt: number) => {
  const { gravity: g } = params.ball;

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

export const evolveOrientation = (
  params: Params,
  ball: Physics,
  dt: number
) => {
  if (vec.len(ball.w) > 0) {
    const angle = vec.len(ball.w) * dt;
    const axis = vec.norm(ball.w);

    ball.orientation = quat.norm(
      quat.mult(quat.fromAxisAngle(axis, angle), ball.orientation)
    );
  }
};

const collideWithSlate = (params: Params, ball: Physics) => {
  const { restitutionSlate: es } = params.ball;

  // out-of-bounds balls hit an imaginary floor
  const slate = ball.state === PhysicsState.OutOfPlay ? -1 : 0;

  if (ball.r[2] < slate && ball.v[2] < 0) {
    ball.v[2] = -ball.v[2] * es;
    if (Math.abs(ball.v[2]) < 1e-1) {
      ball.v[2] = 0;
      if (ball.state !== PhysicsState.OutOfPlay) {
        ball.state = PhysicsState.Sliding;
      }
    }
  }
};

export const evolvePocket = (
  params: Params,
  ball: Physics,
  pocket: Pocket,
  dt: number
) => {
  const { gravity: g } = params.ball;

  const r0 = vec.setZ(ball.r, 0);
  const p0 = vec.setZ(pocket.position, 0);

  // xy dist from pocket centre -> ball centre
  const delta = vec.sub(r0, p0);
  const dist = vec.len(delta);

  ball.v[2] -= g * dt;

  // pocket edge rolling
  if (
    dist >= pocket.radius - ball.R &&
    ball.r[2] <= 0 &&
    ball.r[2] > -2 * ball.R
  ) {
    const contactPoint = vec.add(
      vec.setZ(pocket.position, -ball.R),
      vec.mult(vec.norm(delta), pocket.radius)
    );
    const normal = vec.norm(vec.sub(ball.r, contactPoint));
    const accelGravity = vec.new(0, 0, -g);
    const accelNormal = vec.mult(normal, vec.dot(accelGravity, normal));
    vec.msub(ball.v, vec.mult(accelNormal, dt));
  } else {
    // slow spin
    vec.mmult(ball.w, 0.5);
  }

  vec.madd(ball.r, vec.mult(ball.v, dt));

  // internal cylinder collision
  if (dist > pocket.radius - ball.R) {
    // edge of pocket
    const normal = vec.norm(vec.sub(ball.r, p0));

    const vn = vec.dot(ball.v, normal);
    if (vn > 0) {
      const vz = ball.v[2];
      vec.msub(ball.v, vec.mult(normal, 2 * vn));
      vec.mmult(ball.v, 0.5);
      if (vec.lenSq(ball.v) < 1e-8) {
        vec.mmult(ball.v, 0);
      }
      ball.v[2] = vz;
    }
  }

  // cylinder base collision
  const bottomZ = pocket.position[2] - pocket.depth / 2;
  if (ball.r[2] - ball.R < bottomZ) {
    const overlap = bottomZ - ball.r[2] + ball.R;
    ball.r[2] += overlap;
    ball.v[2] = 0;
    vec.mmult(ball.v, 0.5);

    // if (b.v[2] < 0) {
    //   b.v[2] = -b.v[2] * ep;
    // }
  }
};
