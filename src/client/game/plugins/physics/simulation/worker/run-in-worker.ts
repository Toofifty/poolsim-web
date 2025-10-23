import type { ReturnedMessage, SimulationWorkerFn } from './types';

const createKey = () => Math.floor(Math.random() * 10000);

export const runInWorker = <TFn extends SimulationWorkerFn>(
  worker: Worker,
  fn: TFn['fn'],
  args: TFn['args']
): Promise<TFn['result']> => {
  const key = createKey();
  worker.postMessage({ fn, key, args });
  return new Promise((res, rej) => {
    worker.onmessage = ({
      data: { fn: returnedFn, key: returnedKey, result },
    }: ReturnedMessage) => {
      if (returnedFn === fn && key === returnedKey) res(result);
    };
    worker.onerror = (error) => rej(error);
  });
};
