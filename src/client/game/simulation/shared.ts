import type { Result } from '../../../common/simulation/result';
import type { RunSimulationOptions } from '../../../common/simulation/simulation';
import type { TableState } from '../../../common/simulation/table-state';

export type RunSimulationFn = {
  fn: 'run';
  args: RunSimulationOptions;
  result: Result;
};

export type RunBatchSimulationFn = {
  fn: 'runBatch';
  args: { args: Omit<RunSimulationOptions, 'state'>[]; state: TableState };
  result: Result[];
};

export type SimulationWorkerFn = RunSimulationFn | RunBatchSimulationFn;

export type SentMessage = {
  data: { key: number } & (
    | Pick<RunSimulationFn, 'fn' | 'args'>
    | Pick<RunBatchSimulationFn, 'fn' | 'args'>
  );
};

export type ReturnedMessage = {
  data: { key: number } & (
    | Pick<RunSimulationFn, 'fn' | 'result'>
    | Pick<RunBatchSimulationFn, 'fn' | 'result'>
  );
};
