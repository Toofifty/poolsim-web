import { type Params } from '@common/simulation/physics';
import type { Shot } from '@common/simulation/shot';
import { Profiler, type IProfiler } from '@common/util/profiler';
import { shoot } from '../actions/shoot';
import { addTrackingPoint, createResult, type Result } from './result';
import type { SimulationState } from './state';
import { simulationStep } from './step';
import { settled } from './tools';

export type RunSimulationParameters = {
  params: Params;
  shot: Shot;
  /** data is cloned before the simulation is run */
  state: SimulationState;
  trackPath: boolean;
  profiler?: IProfiler;
  stopAtFirstContact?: boolean;
  stopAtFirstBallContact?: boolean;
  // todo: accept GameRules
};

export const runSimulation = ({
  params,
  shot,
  state: original,
  trackPath,
  profiler = Profiler.none,
  stopAtFirstContact,
  stopAtFirstBallContact,
}: RunSimulationParameters): Result => {
  const state = structuredClone(original);

  shoot(state.balls[0], shot);

  const end = profiler.start('run');
  let result = createResult();

  // todo
  const isInvalidBreak = false;

  for (let i = 0; i < params.simulation.maxIterations; i++) {
    result = profiler.profile('step', () =>
      simulationStep(1 / params.simulation.updatesPerSecond, state, {
        params,
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
