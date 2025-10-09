export abstract class Component {
  public getDebugObject(): Record<string, any> {
    return {};
  }
}

export type ComponentClass<T extends Component> = new (...args: any[]) => T;

export type ExtractComponent<T> = T extends ComponentClass<infer U> ? U : never;
export type ExtractComponents<T extends ComponentClass<any>[]> = T extends [
  infer Head,
  ...infer Tail
]
  ? Tail extends ComponentClass<any>[]
    ? [ExtractComponent<Head>, ...ExtractComponents<Tail>]
    : never
  : [];
