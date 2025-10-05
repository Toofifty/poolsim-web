import { vec, type Vec } from './vec';

export const solveQuadraticRoots = (
  a: number,
  b: number,
  c: number
): number[] => {
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) < 1e-12) return [];
    return [-c / b];
  }

  const disc = b * b - 4 * a * c;
  if (disc <= 0) return [];
  const sqrtD = Math.sqrt(disc);

  const q = -0.5 * (b + Math.sign(b) * sqrtD);
  const t1 = q / a;
  const t2 = c / q;

  return t1 < t2 ? [t1, t2] : [t2, t1];
};

// helper: solve |p0 + v*t - P|^2 = R^2
export const solveQuadraticPointCollisionRoots = (
  p0: Vec,
  v: Vec,
  R: number,
  P: Vec
): number[] => {
  // expand: |(p0-P) + v t|^2 = R^2
  // (v·v) t^2 + 2 v·(p0-P) t + (p0-P)·(p0-P) - R^2 = 0
  const d = vec.sub(p0, P);
  const a = vec.dot(v, v);
  const b = 2 * vec.dot(v, d);
  const c = vec.dot(d, d) - R * R;
  return solveQuadraticRoots(a, b, c);
};
