import { vec, type Vec } from '@common/math';
import { defaultParams } from '@common/simulation/physics';
import { computeIdealAngularVelocity } from '../evolution/compute';
import type { Physics } from '../physics.component';

export const applyBallCollisionSpin = (
  ball1: Physics,
  ball2: Physics,
  impulse: Vec,
  normal: Vec
) => {
  const { frictionBall: ub } = defaultParams.ball;

  const R1 = ball1.R;
  const R2 = ball2.R;
  const I1 = (2 / 5) * ball1.m * R1 * R1;
  const I2 = (2 / 5) * ball2.m * R2 * R2;

  // relative vectors from center to contact
  const r1 = vec.mult(normal, -R1);
  const r2 = vec.mult(normal, R2);

  // velocity at contact points
  const vContact1 = vec.add(ball1.v, vec.cross(ball1.w, r1));
  const vContact2 = vec.add(ball2.v, vec.cross(ball2.w, r2));
  const vRel = vec.sub(vContact1, vContact2);

  // tangential component only
  const vRel_t = vec.sub(vRel, vec.mult(normal, vec.dot(vRel, normal)));

  const vRel_t_len = vec.len(vRel_t);
  if (vRel_t_len > 1e-12) {
    // tangential effective mass
    const Kt = 1 / ball1.m + 1 / ball2.m + (R1 * R1) / I1 + (R2 * R2) / I2;

    // unconstrained tangential impulse
    let Jt = vec.mult(vRel_t, -1 / Kt);

    // Coulomb friction limit based on normal impulse
    const JtMax = vec.len(impulse) * ub;

    if (vec.len(Jt) > JtMax) {
      Jt = vec.mult(vec.norm(Jt), JtMax);
    }

    if (vec.len(Jt) > 1e-2) {
      // only apply spin transfer for substantial velocities
      vec.msub(ball1.v, vec.mult(Jt, 1 / ball1.m));
      vec.madd(ball2.v, vec.mult(Jt, 1 / ball2.m));

      vec.msub(ball1.w, vec.mult(vec.cross(normal, Jt), R1 / I1));
      vec.madd(ball2.w, vec.mult(vec.cross(normal, Jt), R2 / I2));
    } else {
      // otherwise, set to expected w
      vec.mcopy(ball1.w, computeIdealAngularVelocity(ball1));
      vec.mcopy(ball2.w, computeIdealAngularVelocity(ball2));
    }
  }
};
