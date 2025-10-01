import type { ReturnedMessage, SimulationWorkerFn } from './shared';

const createKey = () => Math.floor(Math.random() * 10000);

export const runInWorker = <TFn extends SimulationWorkerFn>(
  worker: Worker,
  fn: TFn['fn'],
  args: TFn['args']
): Promise<TFn['result']> => {
  const key = createKey();
  worker.postMessage({ fn, key, args });
  return new Promise((res) => {
    worker.onmessage = ({
      data: { fn: returnedFn, key: returnedKey, result },
    }: ReturnedMessage) => {
      if (returnedFn === fn && key === returnedKey) res(result);
    };
  });
};
