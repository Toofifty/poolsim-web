import { hydrateResult, hydrateResults } from './hydrate';
import { runInWorker } from './run-in-worker';
import { type RunSimulationFn, type RunBatchSimulationFn } from './shared';
import {
  type ISimulation,
  type RunSimulationOptions,
} from '../../../common/simulation/simulation';
import SimulationWorker from './simulation.worker?worker';
import type { TableState } from '../../../common/simulation/table-state';

/**
 * Uses a web worker to run a simulation
 */
export class ThreadedSimulation implements ISimulation {
  private worker: Worker;

  constructor() {
    this.worker = new SimulationWorker();
  }

  public async run(params: RunSimulationOptions) {
    return hydrateResult(
      await runInWorker<RunSimulationFn>(this.worker, 'run', params)
    );
  }

  public async runBatch(
    params: Omit<RunSimulationOptions, 'state'>[],
    state: TableState
  ) {
    return hydrateResults(
      await runInWorker<RunBatchSimulationFn>(this.worker, 'runBatch', {
        params,
        state,
      })
    );
  }
}
