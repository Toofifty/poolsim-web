import type { PhysicsBall } from '../ball';
import type {
  BallBallCollision,
  BallCushionCollision,
  BallPocketCollision,
} from '../collision';
import type { PhysicsCushion } from '../cushion';
import { vec } from '../math';
import { params } from '../params';
import type { PhysicsPocket } from '../pocket';

const { restitutionBall: eb, restitutionPocket: ep } = params.ball;

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
      const correction = vec.mult(normal, (overlap * 1.01) / 2);
      vec.madd(b1.r, correction);
      vec.msub(b2.r, correction);
    }

    if (rv > 0) {
      // balls are already moving away from each other
      return undefined;
    }

    const j = ((1 + eb) * rv) / 2;
    const impulse = vec.mult(normal, j);

    vec.msub(b1.v, impulse);
    vec.madd(b2.v, impulse);

    vec.msetXY(b1.w, vec.mult(b1.w, 0.5));
    vec.msetXY(b2.w, vec.mult(b2.w, 0.5));

    // todo: spin transfer
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

    const j = -(1 + params.ball.restitutionCushion) * rv;
    const impulse = vec.mult(normal, j);
    vec.madd(b.v, impulse);

    const spinAlongNormal = vec.dot(b.w, normal);
    const correction = vec.mult(normal, spinAlongNormal * 0.9);

    const wz = b.w[2];
    vec.msub(b.w, correction);
    b.w[2] = wz;

    // english
    const tangent = vec.perp(normal);
    const vs = b.w[2] * b.radius;
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
  p: PhysicsPocket,
  simulated = false
): BallPocketCollision | undefined => {
  if (!simulated && b.pocket === p) {
    collidePocketInternal(b, p);
    return undefined;
  }

  const dist = vec.dist(vec.setZ(b.r, 0), vec.setZ(vec.from(p.position), 0));

  if (!b.pocket && dist < p.radius) {
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

const collidePocketInternal = (b: PhysicsBall, p: PhysicsPocket) => {
  const dist = vec.dist(vec.setZ(b.r, 0), vec.setZ(vec.from(p.position), 0));

  if (dist > p.radius - b.radius) {
    // edge of pocket
    const normal = vec.norm(vec.sub(b.r, vec.setZ(vec.from(p.position), 0)));

    // todo: skipping overlap fix for now since it applies
    // as soon as the ball touches the pocket
    // const overlap = dist - (pocket.radius - ball.radius);
    // vec.msub(ball.r, vec.mult(normal, overlap));

    const vn = vec.dot(b.v, normal);
    if (vn > 0) {
      const vz = b.v[2];
      vec.msub(b.v, vec.mult(normal, 2 * vn));
      vec.mmult(b.v, 0.5);
      if (vec.lenSq(b.v) < 1e-8) {
        vec.mmult(b.v, 0);
      }
      b.v[2] = vz;
    }
  }

  const bottomZ = p.position.z - p.depth / 2;
  if (b.r[2] - b.radius < bottomZ) {
    const overlap = bottomZ - b.r[2] + b.radius;
    b.r[2] += overlap;

    if (b.v[2] < 0) {
      b.v[2] = -b.v[2] * ep;
    }

    vec.mmult(b.v, 0.5);
  }
};
