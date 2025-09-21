import { Vector3 } from 'three';

export type Vec = [number, number, number];

export const vec = {
  new: (x?: number, y?: number, z?: number): Vec => [x ?? 0, y ?? 0, z ?? 0],
  clone: (v: Vec): Vec => [v[0], v[1], v[2]],
  from: (v: Vector3): Vec => [v.x, v.y, v.z],
  toVector3: (v: Vec) => new Vector3(v[0], v[1], v[2]),
  toVector3s: (vs: Vec[]) => vs.map((v) => vec.toVector3(v)),

  add: (v1: Vec, v2: Vec): Vec => [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]],
  sub: (v1: Vec, v2: Vec): Vec => [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]],

  mult: (v: Vec, s: number): Vec => [v[0] * s, v[1] * s, v[2] * s],
  div: (v: Vec, s: number): Vec => [v[0] / s, v[1] / s, v[2] / s],

  norm: (v: Vec): Vec => {
    const l = vec.len(v);
    if (l < 1e-8) return vec.zero;
    return [v[0] / l, v[1] / l, v[2] / l];
  },

  lenSq: (v: Vec) => v[0] * v[0] + v[1] * v[1] + v[2] * v[2],
  len: (v: Vec) => Math.sqrt(vec.lenSq(v)),
  isZero: (v: Vec) => v[0] + v[1] + v[2] === 0,

  dist: (v1: Vec, v2: Vec) =>
    Math.sqrt(
      (v1[0] - v2[0]) * (v1[0] - v2[0]) +
        (v1[1] - v2[1]) * (v1[1] - v2[1]) +
        (v1[2] - v2[2]) * (v1[2] - v2[2])
    ),
  dot: (v1: Vec, v2: Vec) => v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2],
  cross: (v1: Vec, v2: Vec): Vec => [
    v1[1] * v2[2] - v1[2] * v2[1],
    v1[2] * v2[0] - v1[0] * v2[2],
    v1[0] * v2[1] - v1[1] * v2[0],
  ],
  setX: (v: Vec, x: number): Vec => [x, v[1], v[2]],
  setY: (v: Vec, y: number): Vec => [v[0], y, v[2]],
  setZ: (v: Vec, z: number): Vec => [v[0], v[1], z],
  xy: (v: Vec): Vec => [v[0], v[1], 0],
  perp: (v: Vec): Vec => [-v[1], v[0], 0],
  /** vec.mult(v, -1) */
  neg: (v: Vec): Vec => [-v[0], -v[1], -v[2]],
  rotate: (v: Vec, axis: Vec, angle: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dot = vec.dot(axis, v);
    const cross = vec.cross(axis, v);

    return vec.add(
      vec.add(vec.mult(v, cos), vec.mult(cross, sin)),
      vec.mult(axis, dot * (1 - cos))
    );
  },

  // mutative - only for class properties
  madd: (v1: Vec, v2: Vec) => {
    v1[0] += v2[0];
    v1[1] += v2[1];
    v1[2] += v2[2];
    return v1;
  },
  msub: (v1: Vec, v2: Vec) => {
    v1[0] -= v2[0];
    v1[1] -= v2[1];
    v1[2] -= v2[2];
    return v1;
  },
  mmult: (v: Vec, s: number) => {
    v[0] *= s;
    v[1] *= s;
    v[2] *= s;
    return v;
  },
  mcopy: (v1: Vec, v2: Vec) => {
    v1[0] = v2[0];
    v1[1] = v2[1];
    v1[2] = v2[2];
    return v1;
  },
  mset: (v: Vec, x: number, y: number, z: number) => {
    v[0] = x;
    v[1] = y;
    v[2] = z;
    return v;
  },
  msetX: (v: Vec, x: number) => {
    v[0] = x;
    return v;
  },
  msetY: (v: Vec, y: number) => {
    v[1] = y;
    return v;
  },
  msetZ: (v: Vec, z: number) => {
    v[2] = z;
    return v;
  },
  msetXY: (v1: Vec, v2: Vec) => {
    v1[0] = v2[0];
    v1[1] = v2[1];
    return v1;
  },

  /** Set components to 0 if near 0 */
  minimise: (v: Vec, epsilon = 1e-8): Vec => [
    Math.abs(v[0]) < epsilon ? 0 : v[0],
    Math.abs(v[1]) < epsilon ? 0 : v[1],
    Math.abs(v[2]) < epsilon ? 0 : v[2],
  ],
  mminimise: (v: Vec, epsilon = 1e-8): Vec => {
    if (Math.abs(v[0]) < epsilon) v[0] = 0;
    if (Math.abs(v[1]) < epsilon) v[1] = 0;
    if (Math.abs(v[2]) < epsilon) v[2] = 0;
    return v;
  },

  toString: (v: Vec) => {
    return v.map((c) => c.toExponential(2)).join(', ');
  },

  zero: [0, 0, 0] as Vec,
  /** 0, 0, 1 */
  UP: [0, 0, 1] as Vec,
  /** 1, 0, 0 */
  LEFT: [1, 0, 0] as Vec,
  /** -1, 0, 0 */
  RIGHT: [-1, 0, 0] as Vec,
  /** 0, 1, 0 */
  FORWARD: [0, 1, 0] as Vec,
};
