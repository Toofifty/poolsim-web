import type { Result, RunSimulationOptions } from './simulation';

export type RunSimulationFn = {
  fn: 'run';
  params: RunSimulationOptions;
  result: Result;
};

export type SimulationWorkerFn = RunSimulationFn;

export type SentMessage<TFn extends SimulationWorkerFn> = {
  data: {
    key: number;
    fn: TFn['fn'];
    params: TFn['params'];
  };
};

export type ReturnedMessage<TFn extends SimulationWorkerFn> = {
  data: {
    key: number;
    fn: TFn['fn'];
    result: TFn['result'];
  };
};
