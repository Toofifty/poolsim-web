export type DeepKeyOf<T extends object> = {
  [K in Exclude<keyof T, symbol>]: T[K] extends object
    ? `${K}${DotPrefix<DeepKeyOf<T[K]>>}`
    : K;
}[Exclude<keyof T, symbol>] extends infer D
  ? Extract<D, string>
  : never;

export type DeepPathOf<T extends object> = {
  [K in Exclude<keyof T, symbol>]: T[K] extends object
    ? K | `${K}${DotPrefix<DeepPathOf<T[K]>>}`
    : K;
}[Exclude<keyof T, symbol>] extends infer D
  ? Extract<D, string>
  : never;

type DotPrefix<T extends string> = T extends '' ? '' : `.${T}`;

export type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : T extends Function
  ? T
  : T extends object
  ? DeepReadonlyObject<T>
  : T;

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};
