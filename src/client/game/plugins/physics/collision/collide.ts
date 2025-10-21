import { vec, type Vec } from '@common/math';
import { type Params } from '@common/simulation/physics';
import { Cushion } from '../../table/cushion.component';
import type { Pocket } from '../../table/pocket.component';
import { computeIdealAngularVelocity } from '../evolution/compute';
import { Physics, PhysicsState } from '../physics.component';
import { solveLinearSystem } from './solver';
import { applyBallCollisionSpin } from './spin';
import type {
  BallBallCollision,
  BallCushionCollision,
  BallPocketCollision,
} from './types';

export type IntermediateCollision = {
  ball1: Physics;
  ball2: Physics;
  normal: Vec;
  /** <= 0 */
  rv: number;
  overlap: number;
};

export const getBallBallCollision = (
  ball1: Physics,
  ball2: Physics
): IntermediateCollision | undefined => {
  if (ball1 === ball2) return undefined;

  const dist = vec.dist(ball1.r, ball2.r);
  if (dist < ball1.R + ball2.R && dist > 0) {
    const normal = vec.norm(vec.sub(ball1.r, ball2.r));
    const rv = vec.dot(vec.sub(ball1.v, ball2.v), normal);
    const overlap = ball1.R + ball2.R - dist;

    if (Math.abs(rv) < 1e-4) {
      const v1 = vec.lenSq(ball1.v);
      const v2 = vec.lenSq(ball2.v);
      if (v1 < 1e-6 && v2 < 1e-6) {
        // balls are gently touching at rest, so we
        // skip the collision
        return undefined;
      }
    }

    if (rv <= 0) {
      return { ball1, ball2, normal, rv, overlap };
    }
  }

  return undefined;
};

/**
 * Solves many collisions at once using an LCP solver.
 * Using this technique to solve collisions on the break (where
 * there would be multiple collisions in a single frame)
 * ensures realistic impulses. It can still be used for single
 * collisions though.
 */
export const solveBallBallCollisions = (
  collisions: IntermediateCollision[],
  params: Params,
  fixOverlap = true
): BallBallCollision[] => {
  const { restitutionBall: eb } = params.ball;

  const n = collisions.length;
  const A = new Array(n).fill(0).map(() => new Array(n).fill(0));
  const b = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    const { ball1, ball2, normal, rv } = collisions[i];
    const invM1 = 1 / ball1.m;
    const invM2 = 1 / ball2.m;

    b[i] = -(1 + eb) * rv;

    for (let j = 0; j < n; j++) {
      const c = collisions[j];
      let term = 0;
      if (ball1 === c.ball1) term += invM1 * vec.dot(normal, c.normal);
      if (ball1 === c.ball2) term -= invM1 * vec.dot(normal, c.normal);
      if (ball2 === c.ball1) term -= invM2 * vec.dot(normal, c.normal);
      if (ball2 === c.ball2) term += invM2 * vec.dot(normal, c.normal);

      A[i][j] = term;
    }
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const avg = 0.5 * (A[i][j] + A[j][i]);
      A[i][j] = avg;
      A[j][i] = avg;
    }
  }

  const j = solveLinearSystem(A, b);

  const trackedCollisions = collisions.map(
    ({ ball1, ball2, normal }) =>
      ({
        type: 'ball-ball',
        initiator: ball1,
        other: ball2,
        position: vec.add(ball1.r, vec.mult(normal, ball1.R)),
        // impulse added later
        impulse: vec.zero,
        snapshots: {
          initiator: Physics.snapshot(ball1),
          other: Physics.snapshot(ball2),
        },
      } satisfies BallBallCollision)
  );

  // apply impulses
  for (let i = 0; i < n; i++) {
    const { ball1, ball2, normal, overlap } = collisions[i];
    const impulse = vec.mult(normal, j[i]);
    const invM1 = 1 / ball1.m;
    const invM2 = 1 / ball2.m;

    if (overlap > 0 && fixOverlap) {
      const correction = vec.mult(normal, (overlap * 1.1) / 2);
      vec.madd(ball1.r, correction);
      vec.msub(ball2.r, correction);
    }

    vec.madd(ball1.v, vec.mult(impulse, invM1));
    vec.msub(ball2.v, vec.mult(impulse, invM2));

    ball1.state = PhysicsState.Sliding;
    ball2.state = PhysicsState.Sliding;

    applyBallCollisionSpin(ball1, ball2, impulse, normal);

    trackedCollisions[i].impulse = impulse;
  }

  return trackedCollisions;
};

export const collideBallCushion = (
  params: Params,
  ball: Physics,
  cushion: Cushion,
  fixOverlap = true
): BallCushionCollision | undefined => {
  if (!Cushion.inBounds(cushion, ball.r)) {
    return undefined;
  }

  const { restitutionCushion: ec, frictionCushion: fc } = params.ball;

  const closestPoint = Cushion.findClosestPoint(cushion, ball.r);

  const diff = vec.sub(ball.r, closestPoint);
  const distSq = vec.lenSq(diff);

  if (distSq <= ball.R * ball.R + 1e-12) {
    const normal = vec.norm(diff);

    const rv = vec.dot(ball.v, normal);
    if (rv > 0) {
      return undefined;
    }

    const overlap = ball.R - Math.sqrt(distSq);
    if (fixOverlap) {
      vec.madd(ball.r, vec.mult(normal, overlap));
    }

    const j = -(1 + ec) * rv;
    const impulse = vec.mult(normal, j);
    vec.madd(ball.v, impulse);
    ball.state = PhysicsState.Sliding;

    const wz = ball.w[2];
    vec.mcopy(ball.w, computeIdealAngularVelocity(ball));
    ball.w[2] = wz;

    // english
    const tangent = vec.perp(normal);
    const vs = ball.w[2] * ball.R * fc;
    vec.madd(ball.v, vec.mult(tangent, vs));
    ball.w[2] *= 0.7;

    return {
      type: 'ball-cushion',
      initiator: ball,
      other: cushion,
      position: closestPoint,
      impulse,
      snapshots: {
        initiator: Physics.snapshot(ball),
      },
    };
  }

  return undefined;
};

export const collideBallPocket = (
  params: Params,
  ball: Physics,
  pocket: Pocket
): BallPocketCollision | undefined => {
  if (ball.state === PhysicsState.Pocketed) {
    // already pocketed, skip
    return undefined;
  }

  const dist = vec.distSq(vec.setZ(ball.r, 0), vec.setZ(pocket.position, 0));

  // only considered in the pocket if within it's radius,
  // and the ball is below rail height
  if (
    dist < pocket.radius * pocket.radius &&
    ball.r[2] - ball.R <= params.cushion.height
  ) {
    ball.state = PhysicsState.Pocketed;
    ball.pocketId = pocket.id;
    return {
      type: 'ball-pocket',
      initiator: ball,
      other: pocket,
      position: ball.r,
      snapshots: {
        initiator: Physics.snapshot(ball),
      },
    };
  }

  return undefined;
};
