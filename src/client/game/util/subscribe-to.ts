import { subscribe } from 'valtio';

type Paths<T extends object> = {
  [K in keyof T]: T[K] extends object ? [K, ...Paths<T[K]>] : [K];
}[keyof T];

type DeepKeyOf<T extends object> = {
  [K in Exclude<keyof T, symbol>]: T[K] extends object
    ? `${K}${DotPrefix<DeepKeyOf<T[K]>>}`
    : K;
}[Exclude<keyof T, symbol>] extends infer D
  ? Extract<D, string>
  : never;

type DotPrefix<T extends string> = T extends '' ? '' : `.${T}`;

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
