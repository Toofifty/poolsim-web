import {
  type Component,
  type ComponentClass,
  type ExtractComponents,
} from './component';
import { EventSystem } from './event-system';
import { Query } from './query';
import type { System } from './system';
import type { Entity } from './types';

export class ComponentContainer {
  private map = new Map<Function, Component>();

  public add(component: Component, ctor?: Function): void {
    this.map.set(ctor ?? component.constructor, component);
  }

  public get<T extends Component>(componentClass: ComponentClass<T>): T {
    return this.map.get(componentClass) as T;
  }

  public has(...componentClasses: Function[]): boolean {
    return componentClasses.every((cls) => this.map.has(cls));
  }

  public hasAll(componentClasses: Set<Function>): boolean {
    for (let cls of componentClasses) {
      if (!this.map.has(cls)) {
        return false;
      }
    }
    return true;
  }

  public delete(componentClass: Function): void {
    this.map.delete(componentClass);
  }
}

export class ECS<
  TEventMap extends Record<string, object> = any,
  TWorld = unknown
> {
  private entities = new Map<Entity, ComponentContainer>();
  private systems = new Map<System<TWorld>, Set<Entity>>();
  private eventSystems = new Set<
    EventSystem<keyof TEventMap, TEventMap, TWorld>
  >();
  private resources = new Map<string, any>();

  private nextId = 0;
  private entitiesToDestroy = new Array<Entity>();

  constructor(public game: TWorld) {}

  public addEntity(): Entity {
    let entity = this.nextId;
    this.nextId++;
    this.entities.set(entity, new ComponentContainer());
    return entity;
  }

  public removeEntity(entity: Entity): void {
    this.entitiesToDestroy.push(entity);
  }

  public addComponent(
    entity: Entity,
    component: Component,
    customCtor?: ComponentClass<Component>
  ): void {
    if (!this.entities.has(entity)) {
      throw new Error(
        `Tried to attach component to non-tracked entity ${entity}`
      );
    }

    const ctor =
      customCtor ?? (component.constructor as ComponentClass<Component>);

    this.entities.get(entity)!.add(component, ctor);
    this.checkE(entity);
  }

  public getComponents(entity: Entity): ComponentContainer {
    if (!this.entities.has(entity)) {
      throw new Error(
        `Tried to get components of non-tracked entity ${entity}`
      );
    }
    return this.entities.get(entity)!;
  }

  public get<T extends ComponentClass<Component>[]>(
    entity: Entity,
    ...componentClasses: T
  ): ExtractComponents<T> {
    const components = this.getComponents(entity);
    return componentClasses.map((componentClass) =>
      components.get(componentClass)
    ) as ExtractComponents<T>;
  }

  public has(entity: Entity, ...componentClasses: ComponentClass<Component>[]) {
    const components = this.getComponents(entity);
    return componentClasses.every((componentClass) =>
      components.get(componentClass)
    );
  }

  public query(): Query {
    return new Query([...this.entities.keys()], this);
  }

  public removeComponent(entity: Entity, componentClass: Function): void {
    if (!this.entities.has(entity)) {
      throw new Error(`Tried remove component of non-tracked entity ${entity}`);
    }
    this.entities.get(entity)!.delete(componentClass);
    this.checkE(entity);
  }

  public addSystem(system: System<TWorld>): void {
    if (system.components.size == 0) {
      console.warn('System not added: empty Components list.');
      console.warn(system);
      return;
    }

    this.systems.set(system, new Set());
    for (let entity of this.entities.keys()) {
      this.checkES(entity, system);
    }
  }

  public removeSystem(system: System<TWorld>): void {
    this.systems.delete(system);
  }

  public addEventSystem(
    system: EventSystem<keyof TEventMap, TEventMap, TWorld>
  ): void {
    this.eventSystems.add(system);
  }

  public removeEventSystem(
    system: EventSystem<keyof TEventMap, TEventMap, TWorld>
  ) {
    this.eventSystems.delete(system);
  }

  public update(): void {
    for (let [system, entities] of this.systems.entries()) {
      system.runAll(this, entities);
    }

    while (this.entitiesToDestroy.length > 0) {
      this.destroyEntity(this.entitiesToDestroy.shift()!);
    }
  }

  private destroyEntity(entity: Entity): void {
    [...this.systems.entries()].forEach(([system, entitySet]) => {
      // todo: on destroy
      entitySet.delete(entity);
    });
    this.entities.delete(entity);
  }

  private checkE(entity: Entity): void {
    for (let system of this.systems.keys()) {
      this.checkES(entity, system);
    }
  }

  private checkES(entity: Entity, system: System<TWorld>): void {
    if (!this.entities.has(entity)) {
      throw new Error(`Tried check systems of non-tracked entity ${entity}`);
    }

    if (!this.systems.has(system)) {
      throw new Error(`Tried check systems of non-tracked system ${entity}`);
    }

    const have = this.entities.get(entity)!;
    const need = system.components;
    if (have.hasAll(need)) {
      if (!this.systems.get(system)!.has(entity)) {
        this.systems.get(system)!.add(entity);
      }
    } else {
      if (this.systems.get(system)!.has(entity)) {
        this.systems.get(system)!.delete(entity);
        // todo: on destroy
      }
    }
  }

  public createAndSpawn(...components: Component[]) {
    const eid = this.addEntity();
    components.forEach((component) => this.addComponent(eid, component));
    return this.spawn(eid);
  }

  public spawn(entity: number) {
    for (let [system] of this.systems.entries()) {
      const have = this.entities.get(entity)!;
      const need = system.components;
      if (have.hasAll(need)) {
        // todo: on spawn
      }
    }
    return entity;
  }

  public debug(entity: number) {
    if (!this.entities.has(entity)) {
      throw new Error(`Tried to debug non-tracked entity ${entity}`);
    }
  }
}
