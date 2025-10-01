import { subscribe } from 'valtio';
import type { DeepKeyOf } from '../../util/types';

export const subscribeTo = <T extends object>(
  proxyObject: T,
  paths: DeepKeyOf<T>[],
  callback: () => void
) => {
  const pathSet = new Set(paths);
  return subscribe(proxyObject, ([[op, segments, value]]) => {
    if (op !== 'set') return;
    const path = segments.join('.');
    if (pathSet.has(path as any)) {
      callback();
    }
  });
};

export const runAndSubscribeTo = <T extends object>(
  proxyObject: T,
  paths: DeepKeyOf<T>[],
  callback: () => void
) => {
  callback();
  const pathSet = new Set(paths);
  return subscribe(proxyObject, ([[op, segments]]) => {
    if (op !== 'set') return;
    const path = segments.join('.');
    if (pathSet.has(path as any)) {
      callback();
    }
  });
};
