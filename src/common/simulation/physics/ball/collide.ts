import { vec, type Vec } from '../../../math';
import type {
  BallBallCollision,
  BallCushionCollision,
  BallPocketCollision,
} from '../../collision';
import type { PhysicsBall } from '../ball';
import type { PhysicsCushion } from '../cushion';
import { params } from '../params';
import type { PhysicsPocket } from '../pocket';

const {
  mass: m,
  restitutionBall: eb,
  restitutionPocket: ep,
  restitutionCushion: ec,
  frictionCushion: fc,
} = params.ball;

export const collideBallBall = (
  b1: PhysicsBall,
  b2: PhysicsBall
): BallBallCollision | undefined => {
  if (b1 === b2) return undefined;

  const dist = vec.dist(b1.r, b2.r);

  if (dist > 0 && dist < b1.radius + b2.radius) {
    const initial = vec.clone(b1.r);
    const otherInitial = vec.clone(b2.r);

    const normal = vec.norm(vec.sub(b1.r, b2.r));
    const rv = vec.dot(vec.sub(b1.v, b2.v), normal);

    const overlap = b1.radius + b2.radius - dist;
    if (overlap > 0) {
      const correction = vec.mult(normal, (overlap * 1.1) / 2);
      vec.madd(b1.r, correction);
      vec.msub(b2.r, correction);
    }

    if (rv > 0) {
      // balls are already moving away from each other
      return undefined;
    }

    const j = ((1 + eb) * rv) / 2;
    const impulse = vec.mult(normal, j);

    // impulse from collision
    vec.msub(b1.v, impulse);
    vec.madd(b2.v, impulse);

    applyBallCollisionSpin(b1, b2, impulse, normal);

    return {
      type: 'ball-ball',
      initiator: b1,
      other: b2,
      position: vec.add(b1.r, vec.mult(normal, b1.radius)),
      impulse,
      snapshots: {
        initiator: b1.snapshot({ position: initial }),
        other: b2.snapshot({ position: otherInitial }),
      },
    };
  }

  return undefined;
};

const applyBallCollisionSpin = (
  b1: PhysicsBall,
  b2: PhysicsBall,
  impulse: Vec,
  normal: Vec
) => {
  const R1 = b1.radius;
  const R2 = b2.radius;
  const m = params.ball.mass;
  const I1 = (2 / 5) * m * R1 * R1;
  const I2 = (2 / 5) * m * R2 * R2;

  // relative vectors from center to contact
  const r1 = vec.mult(normal, -R1);
  const r2 = vec.mult(normal, R2);

  // velocity at contact points
  const vContact1 = vec.add(b1.v, vec.cross(b1.w, r1));
  const vContact2 = vec.add(b2.v, vec.cross(b2.w, r2));
  const vRel = vec.sub(vContact1, vContact2);

  // tangential component only
  const vRel_t = vec.sub(vRel, vec.mult(normal, vec.dot(vRel, normal)));

  const vRel_t_len = vec.len(vRel_t);
  if (vRel_t_len > 1e-12) {
    // tangential effective mass
    const Kt = 1 / m + 1 / m + (R1 * R1) / I1 + (R2 * R2) / I2;

    // unconstrained tangential impulse
    let Jt = vec.mult(vRel_t, -1 / Kt);

    // Coulomb friction limit based on normal impulse
    const mu = params.ball.frictionBall;
    const JtMax = vec.len(impulse) * mu;

    if (vec.len(Jt) > JtMax) {
      Jt = vec.mult(vec.norm(Jt), JtMax);
    }

    if (vec.len(Jt) > 1e-2) {
      // only apply spin transfer for substantial velocities
      vec.msub(b1.v, vec.mult(Jt, 1 / m));
      vec.madd(b2.v, vec.mult(Jt, 1 / m));

      vec.msub(b1.w, vec.mult(vec.cross(normal, Jt), R1 / I1));
      vec.madd(b2.w, vec.mult(vec.cross(normal, Jt), R2 / I2));
    } else {
      // otherwise, set to expected w
      vec.mcopy(b1.w, b1.getIdealAngularVelocity());
      vec.mcopy(b2.w, b2.getIdealAngularVelocity());
    }
  }
};

export const collideBallCushion = (
  b: PhysicsBall,
  c: PhysicsCushion
): BallCushionCollision | undefined => {
  if (!c.inBounds(b.r)) {
    return undefined;
  }

  const closestPoint = c.findClosestPoint(b.r);

  const diff = vec.sub(b.r, closestPoint);
  const dist = vec.len(diff);

  if (dist < b.radius) {
    const normal = vec.norm(diff);

    const overlap = b.radius - dist;
    vec.madd(b.r, vec.mult(normal, overlap));

    const rv = vec.dot(b.v, normal);
    if (rv > 0) {
      return undefined;
    }

    const j = -(1 + ec) * rv;
    const impulse = vec.mult(normal, j);
    vec.madd(b.v, impulse);

    const wz = b.w[2];
    vec.mcopy(b.w, b.getIdealAngularVelocity());
    b.w[2] = wz;

    // english
    const tangent = vec.perp(normal);
    const vs = b.w[2] * b.radius * fc;
    vec.madd(b.v, vec.mult(tangent, vs));
    b.w[2] *= 0.7;

    return {
      type: 'ball-cushion',
      initiator: b,
      other: c,
      position: closestPoint,
      impulse,
      snapshots: {
        initiator: b.snapshot(),
      },
    };
  }

  return undefined;
};

export const collideBallPocket = (
  b: PhysicsBall,
  p: PhysicsPocket
): BallPocketCollision | undefined => {
  if (b.pocket) {
    // already pocketed, skip
    return undefined;
  }

  const dist = vec.dist(vec.setZ(b.r, 0), vec.setZ(p.position, 0));

  // only considered in the pocket if within it's radius,
  // and the ball is below rail height
  if (dist < p.radius && b.r[2] <= params.cushion.height) {
    b.addToPocket(p);
    return {
      type: 'ball-pocket',
      initiator: b,
      other: p,
      position: b.r,
      snapshots: {
        initiator: b.snapshot(),
      },
    };
  }

  return undefined;
};
