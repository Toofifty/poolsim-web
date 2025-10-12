import { vec } from '@common/math';
import { solveQuadraticRoots } from '@common/math/solve';
import type { Cushion } from '../../table/cushion.component';
import {
  computeMomentaryFrictionAccel,
  computeMomentaryFrictionDelta,
} from '../evolution/compute';
import { PhysicsState, type Physics } from '../physics.component';

export const computeBallCollisionTime = (
  ball1: Physics,
  ball2: Physics,
  dt: number
): number => {
  if (ball1 === ball2) return Infinity;
  if (
    ball1.state === PhysicsState.Stationary &&
    ball2.state === PhysicsState.Stationary
  )
    return Infinity;

  const ball1V = vec.add(ball1.v, computeMomentaryFrictionDelta(ball1, dt));
  const ball2V = vec.add(ball2.v, computeMomentaryFrictionDelta(ball2, dt));

  const dr = vec.sub(ball1.r, ball2.r);
  const dv = vec.sub(ball1V, ball2V);
  if (vec.dot(dr, dv) >= 0) return Infinity;

  const R = ball1.R + ball2.R;

  const a = vec.dot(dv, dv);
  if (a === 0) return Infinity;

  const b = 2 * vec.dot(dr, dv);
  const c = vec.dot(dr, dr) - R * R;

  const disc = b * b - 4 * a * c;
  if (disc < 0) return Infinity;
  const sqrtDisc = Math.sqrt(disc);

  const t1 = (-b - sqrtDisc) / (2 * a);
  const t2 = (-b + sqrtDisc) / (2 * a);

  if (t1 >= 0 && t1 < dt) return t1;
  if (t2 >= 0 && t2 < dt) return t2;
  return Infinity;
};

export const computeCushionCollisionTime = (
  ball: Physics,
  cushion: Cushion,
  dt: number
): number => {
  if (ball.state === PhysicsState.Stationary) return Infinity;

  const p0 = ball.r;
  const a = computeMomentaryFrictionAccel(ball);
  const v0 = ball.v;
  const R = ball.R;

  let bestT = Infinity;
  for (const [A, B] of cushion.segments) {
    const edge = vec.sub(B, A);
    const edgeLen = vec.len(edge);
    const edgeDir = vec.norm(edge);
    const normal = vec.perp(edgeDir);

    const d0 = vec.dot(normal, vec.sub(p0, A));
    const vn = vec.dot(normal, v0);
    const an = vec.dot(normal, a);

    for (const sign of [+1, -1]) {
      const c = d0 - sign * R;
      for (let t of solveQuadraticRoots(0.5 * an, vn, c)) {
        if (t <= 1e-8 || t >= dt || t >= bestT) continue;

        const pt = vec.add(
          p0,
          vec.add(vec.mult(v0, t), vec.mult(a, 0.5 * t * t))
        );
        const rel = vec.sub(pt, A);
        const u = vec.dot(rel, edgeDir);
        if (u >= 0 && u <= edgeLen) {
          bestT = t;
        }
      }
    }

    // endpoint collisions
    // for (const P of [A, B]) {
    //   for (const t of solveQuadraticPointCollisionRoots(p0, v0, R, P)) {
    //     if (t > 1e-8 && t < bestT) bestT = t;
    //   }
    // }
  }

  return bestT;
};
