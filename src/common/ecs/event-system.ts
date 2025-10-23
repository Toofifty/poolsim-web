import type { ECS } from './main';

export abstract class EventSystem<
  TEvent extends keyof TEventMap,
  TEventMap extends Record<string, any> = any,
  TWorld = unknown
> {
  public abstract event: TEvent;

  public abstract run(
    ecs: ECS<TEventMap, TWorld>,
    data: TEventMap[TEvent]
  ): void;
}
