import {
  snapshot as valtioSnapshot,
  subscribe as valtioSubscribe,
  type Snapshot,
} from 'valtio';
import type { DeepKeyOf } from '../../util/types';

export const snapshot: typeof valtioSnapshot = <T extends object>(
  proxyObject: T
) => {
  try {
    return valtioSnapshot(proxyObject);
  } catch {
    return proxyObject as Snapshot<T>;
  }
};

export const subscribe: typeof valtioSubscribe = (...args) => {
  try {
    return valtioSubscribe(...args);
  } catch {
    return () => {};
  }
};

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
