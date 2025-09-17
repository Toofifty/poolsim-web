import { hydrateResult } from './hydrate';
import { runInWorker } from './run-in-worker';
import { type ISimulation, type RunSimulationOptions } from './simulation';
import SimulationWorker from './simulation.worker?worker';

/**
 * Uses a web worker to run a simulation
 */
export class ThreadedSimulation implements ISimulation {
  private worker: Worker;

  constructor() {
    this.worker = new SimulationWorker();
  }

  public async run(params: RunSimulationOptions) {
    return hydrateResult(await runInWorker(this.worker, 'run', params));
  }
}
