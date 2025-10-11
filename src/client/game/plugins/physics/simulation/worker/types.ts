import type { Result } from '../result';
import type { RunSimulationParameters } from '../run';

export type RunSimulationFn = {
  fn: 'run';
  args: RunSimulationParameters;
  result: Result;
};

export type SimulationWorkerFn = RunSimulationFn;

export type SentMessage = {
  data: { key: number } & Pick<RunSimulationFn, 'fn' | 'args'>;
};

export type ReturnedMessage = {
  data: { key: number } & Pick<RunSimulationFn, 'fn' | 'result'>;
};
