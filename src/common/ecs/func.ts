import type { ECSComponent } from './component';
import { ComponentTrackingSystem } from './component-tracking-system';
import { EventSystem } from './event-system';
import type { ECS } from './main';
import { StartupSystem } from './startup-system';
import { System } from './system';
import type { Entity } from './types';

type EventMap = Record<string, any>;

/**
 * Creates a plugin installer. The install function should
 * return a callback to uninstall all features it added.
 *
 * This is used to group a bundle of feature systems together,
 * and should not interact with entities or components directly.
 * To spawn or modify entities, register a startup system.
 */
export const createPlugin = <TEventMap extends EventMap, TWorld = unknown>(
  install: (ecs: ECS<TEventMap, TWorld>) => () => void
) => ({ install });

export const createEventSystemFactory =
  <TEventMap extends EventMap, TWorld = unknown>() =>
  <TEvent extends keyof TEventMap>(
    event: TEvent,
    system: (ecs: ECS<TEventMap, TWorld>, data: TEventMap[TEvent]) => void
  ): EventSystem<TEvent, TEventMap> =>
    new (class extends EventSystem<TEvent, TEventMap> {
      public event = event;

      public run(ecs: ECS<TEventMap, TWorld>, data: TEventMap[TEvent]): void {
        system(ecs, data);
      }
    })();

export const createStartupSystem = <
  TEventMap extends EventMap,
  TWorld = unknown
>(
  system: (ecs: ECS<TEventMap, TWorld>) => void
): StartupSystem =>
  new (class extends StartupSystem {
    public run(ecs: ECS<TEventMap, TWorld>): void {
      system(ecs);
    }
  })();

export const createComponentTrackingSystemFactory =
  <TEventMap extends EventMap, TWorld = unknown>() =>
  <T extends ECSComponent>(
    predicate: (component: ECSComponent) => component is T,
    added: (ecs: ECS<TEventMap, TWorld>, entity: Entity, component: T) => void,
    removed: (ecs: ECS<TEventMap, TWorld>, entity: Entity, component: T) => void
  ): ComponentTrackingSystem<T> =>
    new (class extends ComponentTrackingSystem<T> {
      public predicate = predicate;

      public added(
        ecs: ECS<TEventMap, TWorld>,
        entity: Entity,
        component: T
      ): void {
        added(ecs, entity, component);
      }

      public removed(
        ecs: ECS<TEventMap, TWorld>,
        entity: Entity,
        component: T
      ): void {
        removed(ecs, entity, component);
      }
    })();

export const createComponentTrackingSystem =
  createComponentTrackingSystemFactory();

export const createSystemFactory =
  <TEventMap extends EventMap, TWorld = unknown>() =>
  (
    track: Function[],
    system:
      | ((ecs: ECS<TEventMap, TWorld>, entity: Entity) => void)
      | {
          before?: (
            ecs: ECS<TEventMap, TWorld>,
            entities: Set<Entity>
          ) => boolean;
          after?: (ecs: ECS<TEventMap, TWorld>, entities: Set<Entity>) => void;
          runAll?: (ecs: ECS<TEventMap, TWorld>, entities: Set<Entity>) => void;
          run?: (ecs: ECS<TEventMap, TWorld>, entity: Entity) => void;
        }
  ): System<TWorld> =>
    new (class extends System<TWorld> {
      public components: Set<Function> = new Set(track);

      public before(ecs: ECS<any, TWorld>, entities: Set<Entity>): boolean {
        if (typeof system === 'function') {
          return true;
        }
        return system.before?.(ecs, entities) ?? true;
      }

      public after(ecs: ECS<any, TWorld>, entities: Set<Entity>): void {
        if (typeof system !== 'function') {
          system.after?.(ecs, entities);
        }
      }

      public runAll(ecs: ECS<any, TWorld>, entities: Set<Entity>): void {
        if (typeof system !== 'function' && system.runAll) {
          system.runAll(ecs, entities);
        } else {
          super.runAll(ecs, entities);
        }
      }

      public run(ecs: ECS<TEventMap, TWorld>, entity: Entity): void {
        if (typeof system === 'function') {
          system(ecs, entity);
        } else {
          system.run?.(ecs, entity);
        }
      }
    })();

export const createSystem = createSystemFactory();
