import { vec } from '@common/math';
import { defaultParams } from '@common/simulation/physics';
import { Shot } from '@common/simulation/shot';
import { PhysicsState, type Physics } from '../physics.component';

export const shoot = (ball: Physics, shot: Shot) => {
  const velocity = Shot.getVelocity(shot);
  let direction = vec.norm(velocity);
  if (shot.lift > 0) {
    const right = vec.norm(vec.cross(vec.UP, direction));
    direction = vec.norm(vec.rotate(direction, right, shot.lift));
  }

  const I = 0.4 * ball.R * ball.R;

  const right = vec.norm(vec.cross(vec.UP, direction));
  const up = vec.norm(vec.cross(direction, right));

  // apply spins
  if (Math.abs(shot.topSpin) > 0) {
    const r = vec.mult(
      up,
      shot.topSpin * defaultParams.ball.spinMultiplier * ball.R
    );
    const dw = vec.mult(vec.cross(r, direction), 1 / I);
    vec.madd(ball.w, dw);
  }

  if (Math.abs(shot.sideSpin) > 0) {
    const r = vec.mult(
      right,
      shot.sideSpin * defaultParams.ball.spinMultiplier * ball.R
    );
    const dw = vec.mult(vec.cross(r, direction), 1 / I);
    vec.madd(ball.w, dw);
  }

  const dv = vec.mult(direction, vec.len(velocity));
  // contribute less to vertical velocity based on where the cue ball is hit
  dv[2] *= Math.cos((shot.sideSpin * Math.PI) / 2);
  vec.madd(ball.v, dv);

  ball.state = PhysicsState.Sliding;
};
