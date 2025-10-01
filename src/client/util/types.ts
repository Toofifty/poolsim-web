export type DeepKeyOf<T extends object> = {
  [K in Exclude<keyof T, symbol>]: T[K] extends object
    ? `${K}${DotPrefix<DeepKeyOf<T[K]>>}`
    : K;
}[Exclude<keyof T, symbol>] extends infer D
  ? Extract<D, string>
  : never;

type DotPrefix<T extends string> = T extends '' ? '' : `.${T}`;
