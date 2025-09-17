import type { ReturnedMessage, SimulationWorkerFn } from './shared';

const createKey = () => Math.floor(Math.random() * 10000);

export const runInWorker = <TFn extends SimulationWorkerFn>(
  worker: Worker,
  fn: TFn['fn'],
  params: TFn['params']
): Promise<TFn['result']> => {
  const key = createKey();
  worker.postMessage({ fn, key, params });
  return new Promise((res) => {
    worker.onmessage = ({
      data: { fn: returnedFn, key: returnedKey, result },
    }: ReturnedMessage<TFn>) => {
      if (returnedFn === fn && key === returnedKey) res(result);
    };
  });
};
