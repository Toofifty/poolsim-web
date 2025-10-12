import { defaultParams } from '@common/simulation/physics';
import type { Shot } from '@common/simulation/shot';
import { Profiler, type IProfiler } from '@common/util/profiler';
import { shoot } from '../actions/shoot';
import { addTrackingPoint, createResult, type Result } from './result';
import type { SimulationState } from './state';
import { simulationStep } from './step';
import { settled } from './tools';

export type RunSimulationParameters = {
  shot: Shot;
  /** data is cloned before the simulation is run */
  state: SimulationState;
  trackPath: boolean;
  profiler?: IProfiler;
  stopAtFirstContact?: boolean;
  stopAtFirstBallContact?: boolean;
};

export const runSimulation = ({
  shot,
  state: original,
  trackPath,
  profiler = Profiler.none,
  stopAtFirstContact,
  stopAtFirstBallContact,
}: RunSimulationParameters): Result => {
  const state = structuredClone(original);

  shoot(state.balls[0], shot);

  const end = profiler.start('run-simulation');
  let result = createResult();

  // todo
  const isInvalidBreak = false;

  for (let i = 0; i < defaultParams.simulation.maxIterations; i++) {
    result = profiler.profile('step', () =>
      simulationStep(1 / defaultParams.simulation.updatesPerSecond, state, {
        trackPath,
        stepIndex: i,
        result,
        profiler,
        cueBallOnly: result.firstStruck === undefined,
      })
    );

    if (stopAtFirstBallContact && result.cueBallCollisions > 0) {
      break;
    }

    if (
      stopAtFirstContact &&
      (result.cueBallCollisions > 0 || result.cueBallCushionCollisions > 0)
    ) {
      break;
    }

    if (settled(state)) {
      break;
    }
  }

  state.balls.forEach((ball) => {
    addTrackingPoint(result, ball);
  });

  end();

  return result;
};
