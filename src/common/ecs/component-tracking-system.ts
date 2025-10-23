import type { ECSComponent } from './component';
import type { ECS } from './main';
import type { Entity } from './types';

export abstract class ComponentTrackingSystem<T extends ECSComponent> {
  public abstract predicate: (component: ECSComponent) => component is T;

  public abstract added(ecs: ECS, entity: Entity, component: T): void;
  public abstract removed(ecs: ECS, entity: Entity, component: T): void;
}
