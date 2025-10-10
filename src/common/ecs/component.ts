export abstract class Component {
  public getDebugObject(): Record<string, any> {
    return {};
  }

  public dispose() {}
}

export type Ctor<T> = new (...args: any[]) => T;

export type ExtractComponent<T> = T extends Ctor<infer U> ? U : never;
export type ExtractComponents<T extends Ctor<any>[]> = T extends [
  infer Head,
  ...infer Tail
]
  ? Tail extends Ctor<any>[]
    ? [ExtractComponent<Head>, ...ExtractComponents<Tail>]
    : never
  : [];
