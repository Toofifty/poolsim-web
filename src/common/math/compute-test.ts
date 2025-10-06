// npx tsx src/common/math/compute-test.ts

import { compile } from './compiled/compiler';
import { createCompute } from './computed';
import { vec, type Vec } from './vec';

const SHOW_PASSES = false;

const vectorType: Vec = [0, 0, 0];
const numberType: number = 0;

const assertEqual = <T>(name: string, v1: T, v2: T) => {
  if (Array.isArray(v1)) {
    if (!vec.eq(v1 as Vec, v2 as Vec)) {
      console.log('test failed:', name);
      console.error('Expected', v1, 'to equal', v2);
      console.error('diff:', vec.sub(v1 as Vec, v2 as Vec));
      console.error('|diff|:', vec.len(vec.sub(v1 as Vec, v2 as Vec)));
    } else {
      SHOW_PASSES && console.log('test passed:', name);
    }
  } else {
    if (v1 !== v2) {
      console.log('test failed:', name);
      console.error(`Expected scalar ${v1} to equal ${v2}`);
    } else {
      SHOW_PASSES && console.log('test passed:', name);
    }
  }
};

const a = 0.5;
const b = 0.64;
const A = vec.new(24, 53, 4);
const B = vec.new(45, 6, 53);

assertEqual('~A', compile('~A', ['A'] as const, vectorType)(A), vec.norm(A));
assertEqual('|A|', compile('|A|', ['A'] as const, numberType)(A), vec.len(A));
assertEqual(
  '|~A|',
  compile('|~A|', ['A'] as const, numberType)(A),
  0.9999999999999999
);

assertEqual(
  'A * b',
  compile('A * b', ['A', 'b'] as const, vectorType)(A, b),
  vec.mult(A, b)
);

assertEqual(
  '(A * b) * (a * b)',
  compile('(A * b) * (a * b)', ['A', 'a', 'b'] as const, vectorType)(A, a, b),
  vec.mult(vec.mult(A, b), a * b)
);

assertEqual(
  '(A + B) * a',
  compile('(A + B) * a', ['A', 'B', 'a'] as const, vectorType)(A, B, a),
  vec.mult(vec.add(A, B), a)
);

assertEqual(
  'A . B',
  compile('A . B', ['A', 'B'] as const, numberType)(A, B),
  vec.dot(A, B)
);

assertEqual(
  'A * (A . B)',
  compile('A * (A . B)', ['A', 'B'] as const, vectorType)(A, B),
  vec.mult(A, vec.dot(A, B))
);

// test zero-alloc
assertEqual(
  'A * (A . B)',
  compile('A * (A . B)', ['A', 'B'] as const, vectorType)(A, B),
  vec.mult(A, vec.dot(A, B))
);

assertEqual(
  'A * (A . (B + A))',
  compile('A * (A . (B + A))', ['A', 'B'] as const, vectorType)(A, B),
  vec.mult(A, vec.dot(A, vec.add(B, A)))
);

assertEqual(
  'A x B',
  compile('A x B', ['A', 'B'] as const, vectorType)(A, B),
  vec.cross(A, B)
);

assertEqual(
  '(A * a) x B',
  compile('(A * a) x B', ['A', 'B', 'a'] as const, vectorType)(A, B, a),
  vec.cross(vec.mult(A, a), B)
);

assertEqual(
  '[0, 0, 1]',
  compile('[0, 0, 1]', [] as const, vectorType)(),
  vec.new(0, 0, 1)
);

assertEqual(
  '[0, 0, 1] * a',
  compile('[0, 0, 1] * a', ['a'] as const, vectorType)(a),
  vec.mult(vec.new(0, 0, 1), a)
);

assertEqual(
  '([0, 0, 1] * a) x A',
  compile('([0, 0, 1] * a) x A', ['a', 'A'] as const, vectorType)(a, A),
  vec.cross(vec.mult(vec.new(0, 0, 1), a), A)
);

assertEqual(
  'B + ([0, 0, 1] * a) x A',
  compile('B + ([0, 0, 1] * a) x A', ['a', 'A', 'B'] as const, vectorType)(
    a,
    A,
    B
  ),
  vec.add(B, vec.cross(vec.mult(vec.new(0, 0, 1), a), A))
);

const computeFns = createCompute(true);
const baseFns = createCompute(false);

const V = vec.random();
const W = vec.random();
const U = vec.random();
const r = Math.random();
const u = Math.random();
const g = 9.81;
const t = 1 / 300;

const assertSameResult = <T extends keyof typeof computeFns>(
  fn: T,
  ...args: Parameters<(typeof computeFns)[T]>
) => {
  assertEqual(
    fn,
    // @ts-ignore
    computeFns[fn](...args),
    // @ts-ignore
    baseFns[fn](...args)
  );
};

assertSameResult('deltaR', V, u, g, t);
assertSameResult('deltaRU', V, U, u, g, t);
assertSameResult('deltaV', V, u, g, t);
assertSameResult('deltaVU', U, u, g, t);
assertSameResult('contactVelocity', V, W, r);
assertSameResult('idealW', V, r);
assertSameResult('deltaW', U, r, u, g, t);

// const iter = 100_000_000;
//
// console.time('compute-buffer');
// const buffer = vec.new();
// for (let i = 0; i < iter; i++) {
//   const V1 = vec.new(Math.random(), Math.random(), Math.random());
//   const V2 = vec.new(Math.random(), Math.random(), Math.random());
//   const z = mda(V1, V2, buffer);
// }
// console.timeEnd('compute-buffer');

// console.time('vec');
// for (let i = 0; i < iter; i++) {
//   const V1 = vec.new(Math.random(), Math.random(), Math.random());
//   const V2 = vec.new(Math.random(), Math.random(), Math.random());
//   const z = vec.mult(V1, vec.dot(V1, vec.add(V2, V1)));
// }
// console.timeEnd('vec');

// console.time('compute');
// for (let i = 0; i < iter; i++) {
//   const V1 = vec.new(Math.random(), Math.random(), Math.random());
//   const V2 = vec.new(Math.random(), Math.random(), Math.random());
//   const z = mda(V1, V2);
// }
// console.timeEnd('compute');

// console.time('surface-a');
// for (let i = 0; i < iter; i++) {
//   const u = surfaceVelocityA(velocity, normal, angularVelocity, r);
// }
// console.timeEnd('surface-a');

// console.time('surface-b');
// for (let i = 0; i < iter; i++) {
//   const u = surfaceVelocityB(velocity, normal, angularVelocity, r);
// }
// console.timeEnd('surface-b');

// console.time('surface-a-buffer');
// for (let i = 0; i < iter; i++) {
//   const u = surfaceVelocityA(velocity, normal, angularVelocity, r);
// }
// console.timeEnd('surface-a-buffer');
