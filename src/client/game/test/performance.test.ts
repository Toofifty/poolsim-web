// npx tsx src/client/game/test/performance.test.ts

import { vec, type Vec } from '@common/math';
import { defaultParams } from '@common/simulation/physics';
import { Shot } from '@common/simulation/shot';
import { Profiler } from '@common/util/profiler';
import type { Result } from '../plugins/physics/simulation/result';
import { runSimulation } from '../plugins/physics/simulation/run';
import { createSimulationState } from '../plugins/physics/simulation/state';
import { createBallFixtures, mock8BallRack } from './fixtures/create-balls';
import { createCushionFixtures } from './fixtures/create-cushions';
import { createPocketFixtures } from './fixtures/create-pockets';

// shim
(globalThis as any).localStorage = { getItem: () => null };

const profiler = new Profiler();

console.time('test-setup');
const endSetup = profiler.start('setup');
const pockets = profiler.profile('pockets', () => createPocketFixtures());
const cushions = profiler.profile('cushions', () => createCushionFixtures());
const balls = profiler.profile('balls', () =>
  createBallFixtures(mock8BallRack())
);
endSetup();

console.timeEnd('test-setup');
profiler.dump();

const getFinalPositions = (result: Result) => {
  const entries: [number, Vec][] = [];

  for (const [id, points] of result.trackingPoints.entries()) {
    const final = points.at(-1);
    if (final) {
      const minimized = vec.minimise(final.position);
      const rounded = minimized.map((c) => +c.toFixed(3)) as Vec;
      entries.push([id, rounded]);
    } else {
      entries.push([id, vec.new()]);
    }
  }

  return entries;
};

const assertFinalPositions = (
  expected: [number, Vec][],
  received: [number, Vec][]
) => {
  const equal = JSON.stringify(expected) === JSON.stringify(received);
  if (!equal) {
    console.error('fail - mismatched final positions');
    console.error('expected', expected);
    console.error('received', received);
  } else {
    console.log('success - expected positions matched final positions');
  }
};

const expectedBreakResult: [number, Vec][] = [
  [0, [-0.086, 0.43, -0]],
  [1, [-0.776, 0.415, -0]],
  [2, [0.614, -0.164, -0]],
  [3, [0.688, 0.321, -0]],
  [4, [0.697, -0.32, -0]],
  [8, [0.667, 0.009, 0]],
  [5, [0.535, 0.235, -0]],
  [6, [0.754, -0.297, -0]],
  [7, [0.714, -0.025, 0]],
  [9, [0.764, 0.06, -0]],
  [10, [1.138, 0.582, -0.211]],
  [11, [-0.141, 0.394, -0]],
  [12, [1.02, 0.16, -0]],
  [13, [0.913, 0.301, -0]],
  [14, [0.949, 0.392, -0]],
  [15, [-21.751, 31.323, -1.124]],
];

// break
const testBreak = () =>
  profiler.profile('break', () => {
    const shot = new Shot(0, 10);
    const state = createSimulationState(balls, cushions, pockets);
    return runSimulation({
      params: defaultParams,
      shot,
      state,
      trackPath: true,
      profiler,
    });
  });

console.time('break');
const result = testBreak();
console.timeEnd('break');
profiler.dump();
assertFinalPositions(expectedBreakResult, getFinalPositions(result));

// bench: initial
// total time: 1.114s
// collision compute: 966ms
// ball-ball collision compute: 487ms
// ball-ball iter max: 0.9629ms
// ball-cushion collision compute: 475ms
// ball-cushion iter max: 0.9074ms
