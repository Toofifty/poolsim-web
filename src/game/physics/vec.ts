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
    if (l === 0) return vec.zero;
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

  zero: [0, 0, 0] as Vec,
};
