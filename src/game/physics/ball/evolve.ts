import { BallState, type PhysicsBall } from '../ball';
import { quat, vec } from '../math';
import { params } from '../params';

const {
  gravity: g,
  frictionSlide: us,
  frictionRoll: ur,
  frictionSpin: usp,
  frictionAir: ua,
  restitutionSlate: es,
} = params.ball;

export const evolveBallMotion = (ball: PhysicsBall, dt: number) => {
  if (dt === 0 || ball.state === BallState.Stationary) return;

  // state can progress during motion
  let state = ball.state;

  collideWithSlate(ball);

  if (state === BallState.Airborne) {
    // todo: dt breakdown with getAirTime()
    evolveVertical(ball, dt);
    return;
  }

  if (state === BallState.Sliding) {
    const slideTime = ball.getSlideTime();

    if (dt >= slideTime) {
      evolveSlide(ball, slideTime);
      state = BallState.Rolling;
      dt -= slideTime;
    } else {
      evolveSlide(ball, dt);
      return;
    }
  }

  if (state === BallState.Rolling) {
    const rollTime = ball.getRollTime();

    if (dt >= rollTime) {
      evolveRoll(ball, rollTime);
      state = BallState.Spinning;
      dt -= rollTime;
    } else {
      evolveRoll(ball, dt);
      return;
    }
  }

  if (state === BallState.Spinning) {
    const spinTime = ball.getSpinTime();

    return evolveSpin(ball, Math.min(dt, spinTime));
  }
};

const evolveSlide = (ball: PhysicsBall, dt: number) => {
  const u0 = vec.norm(ball.getContactVelocity());

  // acceleration due to friction
  const accel = vec.mult(u0, -us * g);
  // r += vt + 0.5at²
  vec.madd(
    ball.r,
    vec.add(vec.mult(ball.v, dt), vec.mult(accel, 0.5 * dt * dt))
  );

  // v += at
  vec.madd(ball.v, vec.mult(accel, dt));

  // Δw = -(5/2R) μ t (u0 × ẑ)
  const zh = vec.new(0, 0, 1);
  const dw = vec.mult(
    vec.cross(u0, zh),
    -(5 / (2 * ball.radius)) * us * g * dt
  );
  const wIdeal = ball.getIdealAngularVelocity();
  const mw = vec.sub(wIdeal, ball.w);
  if (vec.lenSq(dw) > vec.lenSq(mw)) {
    ball.w[0] = wIdeal[0];
    ball.w[1] = wIdeal[1];
  } else {
    vec.madd(ball.w, dw);
  }

  evolveSpin(ball, dt);
};

const evolveRoll = (ball: PhysicsBall, dt: number) => {
  const vh = vec.norm(ball.v);

  // r += vt - 0.5at²
  const accel = vec.mult(vh, -ur * g);
  vec.madd(
    ball.r,
    vec.add(vec.mult(ball.v, dt), vec.mult(accel, 0.5 * dt * dt))
  );

  const dv = vec.mult(accel, dt);
  if (vec.lenSq(dv) > vec.lenSq(ball.v)) {
    // |a| > |v| -> set velocity to 0
    vec.mcopy(ball.v, vec.zero);
  } else {
    // v += at
    vec.madd(ball.v, dv);
  }

  // align w with v
  const wXY = ball.getIdealAngularVelocity();
  ball.w[0] = wXY[0];
  ball.w[1] = wXY[1];

  evolveSpin(ball, dt);
};

const evolveSpin = (ball: PhysicsBall, dt: number) => {
  const wz = ball.w[2];
  if (Math.abs(wz) < 1e-12) return;

  const r = ball.radius;
  const alpha = (5 * usp * g) / (2 * r);

  const maxT = Math.abs(wz) / alpha;
  const t = Math.min(dt, maxT);

  const sign = wz > 0 ? 1 : -1;
  ball.w[2] = wz - sign * alpha * t;
};

export const evolveBallOrientation = (ball: PhysicsBall, dt: number) => {
  if (vec.len(ball.w) > 0) {
    const angle = vec.len(ball.w) * dt;
    const axis = vec.norm(ball.w);

    ball.orientation = quat.norm(
      quat.mult(quat.fromAxisAngle(axis, angle), ball.orientation)
    );
  }
};

const evolveVertical = (ball: PhysicsBall, dt: number) => {
  const accel = vec.new(0, 0, -g);
  // r += vt + 0.5at²
  vec.madd(
    ball.r,
    vec.add(vec.mult(ball.v, dt), vec.mult(accel, 0.5 * dt * dt))
  );

  // v += at
  vec.madd(ball.v, vec.mult(accel, dt));
};

const collideWithSlate = (ball: PhysicsBall) => {
  if (ball.r[2] < 0 && ball.v[2] < 0) {
    ball.v[2] = -ball.v[2] * es;
    if (Math.abs(ball.v[2]) < 1e-1) {
      ball.v[2] = 0;
    }
  }
};
