import type { Vec } from './vec';

export type Quat = [number, number, number, number];

const w = 0;
const x = 1;
const y = 2;
const z = 3;

export const quat = {
  new: (w = 1, x = 0, y = 0, z = 0): Quat => [w, x, y, z],
  clone: (q: Quat): Quat => [q[0], q[1], q[2], q[3]],
  fromAxisAngle: (axis: Vec, angle: number): Quat => {
    const sha = Math.sin(angle / 2);
    const cha = Math.cos(angle / 2);

    return [cha, axis[0] * sha, axis[1] * sha, axis[2] * sha];
  },

  mult: (q1: Quat, q2: Quat): Quat => [
    q1[w] * q2[w] - q1[x] * q2[x] - q1[y] * q2[y] - q1[z] * q2[z],
    q1[w] * q2[x] + q1[x] * q2[w] + q1[y] * q2[z] - q1[z] * q2[y],
    q1[w] * q2[y] - q1[x] * q2[z] + q1[y] * q2[w] + q1[z] * q2[x],
    q1[w] * q2[z] + q1[x] * q2[y] - q1[y] * q2[x] + q1[z] * q2[w],
  ],
  norm: (q: Quat): Quat => {
    const len = Math.hypot(q[0], q[1], q[2], q[3]);
    if (len === 0) return q;
    return [q[0] / len, q[1] / len, q[2] / len, q[3] / len];
  },

  mcopy: (q1: Quat, q2: Quat) => {
    q1[0] = q2[0];
    q1[1] = q2[1];
    q1[2] = q2[2];
    q1[3] = q2[3];
    return q1;
  },

  random: (): Quat => {
    const u1 = Math.random();
    const u2 = Math.random();
    const u3 = Math.random();

    const sqrt1MinusU1 = Math.sqrt(1 - u1);
    const sqrtU1 = Math.sqrt(u1);

    return [
      sqrtU1 * Math.sin(2 * Math.PI * u3),
      sqrtU1 * Math.cos(2 * Math.PI * u3),
      sqrt1MinusU1 * Math.sin(2 * Math.PI * u2),
      sqrt1MinusU1 * Math.cos(2 * Math.PI * u2),
    ];
  },
};
