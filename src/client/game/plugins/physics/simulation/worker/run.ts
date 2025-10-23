import type { RunSimulationParameters } from '../run';
import { runInWorker } from './run-in-worker';
import Worker from './worker?worker';

const worker = new Worker();

export const runWorkerSimulation = async (
  parameters: RunSimulationParameters
) => {
  // todo: transferable objects
  parameters.state = structuredClone(parameters.state);
  return runInWorker(worker, 'run', parameters);
};
