import type { Shot } from '../physics/shot';
import { Profiler, type IProfiler } from '../profiler';
import { Result } from './simulation';
import SimulationWorker from './simulation.worker?worker';
import type { TableState } from './table-state';

export type RunSimulationOptions = {
  state: TableState;
  shot: Shot;
  profiler?: IProfiler;
};

/**
 * Uses a web worker to run a simulation
 */
export class ThreadedSimulation {
  private worker: Worker;

  constructor() {
    this.worker = new SimulationWorker();
  }

  public run({
    state,
    shot,
    profiler = Profiler.none,
  }: RunSimulationOptions): Result {
    return new Result();
  }
}
