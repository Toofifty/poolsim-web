import { vec } from '@common/math';
import { type Params } from '@common/simulation/physics';
import { Cushion } from '../../table/cushion.component';
import type { Pocket } from '../../table/pocket.component';
import { computeIdealAngularVelocity } from '../evolution/compute';
import { Physics, PhysicsState } from '../physics.component';
import { applyBallCollisionSpin } from './spin';
import type {
  BallBallCollision,
  BallCushionCollision,
  BallPocketCollision,
} from './types';

export const collideBallBall = (
  params: Params,
  ball1: Physics,
  ball2: Physics,
  fixOverlap = true
): BallBallCollision | undefined => {
  if (ball1 === ball2) return undefined;

  const { restitutionBall: eb } = params.ball;

  const dist = vec.dist(ball1.r, ball2.r);

  if (dist > 0 && dist < ball1.R + ball2.R) {
    const initial = vec.clone(ball1.r);
    const otherInitial = vec.clone(ball2.r);

    const normal = vec.norm(vec.sub(ball1.r, ball2.r));
    const rv = vec.dot(vec.sub(ball1.v, ball2.v), normal);

    const overlap = ball1.R + ball2.R - dist;
    if (overlap > 0 && fixOverlap) {
      const correction = vec.mult(normal, (overlap * 1.1) / 2);
      vec.madd(ball1.r, correction);
      vec.msub(ball2.r, correction);
    }

    if (rv > 0) {
      // balls are already moving away from each other
      return undefined;
    }

    const j = ((1 + eb) * rv) / 2;
    const impulse = vec.mult(normal, j);

    // impulse from collision
    vec.msub(ball1.v, impulse);
    vec.madd(ball2.v, impulse);

    ball1.state = PhysicsState.Sliding;
    ball2.state = PhysicsState.Sliding;

    applyBallCollisionSpin(ball1, ball2, impulse, normal);

    return {
      type: 'ball-ball',
      initiator: ball1,
      other: ball2,
      position: vec.add(ball1.r, vec.mult(normal, ball1.R)),
      impulse,
      snapshots: {
        initiator: Physics.snapshot(ball1, { position: initial }),
        other: Physics.snapshot(ball2, { position: otherInitial }),
      },
    };
  }

  return undefined;
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
    ball.r[2] <= params.cushion.height
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
