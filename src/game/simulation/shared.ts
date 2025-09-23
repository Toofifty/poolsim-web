import type { Result } from '../physics/result';
import type { RunSimulationOptions } from './simulation';
import type { TableState } from './table-state';

export type RunSimulationFn = {
  fn: 'run';
  params: RunSimulationOptions;
  result: Result;
};

export type RunBatchSimulationFn = {
  fn: 'runBatch';
  params: { params: Omit<RunSimulationOptions, 'state'>[]; state: TableState };
  result: Result[];
};

export type SimulationWorkerFn = RunSimulationFn | RunBatchSimulationFn;

export type SentMessage = {
  data: { key: number } & (
    | Pick<RunSimulationFn, 'fn' | 'params'>
    | Pick<RunBatchSimulationFn, 'fn' | 'params'>
  );
};

export type ReturnedMessage = {
  data: { key: number } & (
    | Pick<RunSimulationFn, 'fn' | 'result'>
    | Pick<RunBatchSimulationFn, 'fn' | 'result'>
  );
};
