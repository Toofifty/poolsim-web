import { EventSystem } from './event-system';
import type { ECS } from './main';

type EventMap = Record<string, any>;

export const createPlugin = <TEventMap extends EventMap>(
  install: (ecs: ECS<TEventMap>) => void,
  uninstall: (ecs: ECS<TEventMap>) => void
) => {
  return { install, uninstall };
};

export const createEventSystemFactory =
  <TEventMap extends EventMap>() =>
  <TEvent extends keyof TEventMap>(
    event: TEvent,
    system: (ecs: ECS<TEventMap>, data: TEventMap[TEvent]) => void
  ): EventSystem<TEvent, TEventMap> => {
    return new (class extends EventSystem<TEvent, TEventMap> {
      public event = event;

      public run(ecs: ECS<TEventMap, unknown>, data: TEventMap[TEvent]): void {
        system(ecs, data);
      }
    })();
  };
