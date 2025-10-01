import {
  type ISimulation,
  type RunSimulationOptions,
} from '../../../common/simulation/simulation';
import type { TableState } from '../../../common/simulation/table-state';
import { hydrateResult, hydrateResults } from './hydrate';
import { runInWorker } from './run-in-worker';
import { type RunBatchSimulationFn, type RunSimulationFn } from './shared';
import SimulationWorker from './simulation.worker?worker';

/**
 * Uses a web worker to run a simulation
 */
export class ThreadedSimulation implements ISimulation {
  private worker: Worker;

  constructor() {
    this.worker = new SimulationWorker();
  }

  public async run(args: RunSimulationOptions) {
    return hydrateResult(
      await runInWorker<RunSimulationFn>(this.worker, 'run', args)
    );
  }

  public async runBatch(
    args: Omit<RunSimulationOptions, 'state'>[],
    state: TableState
  ) {
    return hydrateResults(
      await runInWorker<RunBatchSimulationFn>(this.worker, 'runBatch', {
        args,
        state,
      })
    );
  }
}
