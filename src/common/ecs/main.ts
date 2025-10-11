import { type Component, type Ctor, type ExtractComponents } from './component';
import { EventSystem } from './event-system';
import { Query } from './query';
import type { Resource } from './resource';
import type { StartupSystem } from './startup-system';
import type { System } from './system';
import type { Entity } from './types';

export class ComponentContainer {
  private map = new Map<Function, Component>();

  public add(component: Component, ctor?: Function): void {
    this.map.set(ctor ?? component.constructor, component);
  }

  public get<T extends Component>(componentClass: Ctor<T>): T {
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

  public values(): MapIterator<Component> {
    return this.map.values();
  }

  public delete(componentClass: Function): void {
    this.map.delete(componentClass);
  }

  public dispose(): void {
    for (const component of this.map.values()) {
      component.dispose();
    }
  }
}

export class ECS<
  TEventMap extends Record<string, object> = any,
  TWorld = unknown
> {
  private entities = new Map<Entity, ComponentContainer>();
  private systems = new Map<System<TWorld>, Set<Entity>>();
  private eventSystems = new Map<
    keyof TEventMap,
    Set<EventSystem<keyof TEventMap, TEventMap, TWorld>>
  >();
  private resources = new Map<Ctor<Resource>, Resource>();
  private startupSystems: StartupSystem[] = [];
  private spawners: (() => void)[] = [];

  private externalListeners = new Map<
    keyof TEventMap,
    Set<(data: TEventMap[keyof TEventMap]) => void>
  >();

  private nextId = 0;
  private entitiesToDestroy = new Array<Entity>();

  public deltaTime = 0;
  public frameId = 0;
  public midframe = false;

  constructor(public game: TWorld) {}

  public emit<T extends keyof TEventMap>(event: T, data: TEventMap[T]) {
    if (event.toString().startsWith('game/')) {
      console.log('event:', event);
    }

    const systems = this.eventSystems.get(event);
    if (systems) {
      systems.forEach((system) => system.run(this, data));
    }

    const externalListeners = this.externalListeners.get(event);
    if (externalListeners) {
      externalListeners.forEach((callback) => callback(data));
    }
  }

  public addResource(resource: Resource): void {
    this.resources.set(resource.constructor as Ctor<Resource>, resource);
  }

  public removeResource(resource: Resource): void {
    this.resources.delete(resource.constructor as Ctor<Resource>);
  }

  public addExternalListener<T extends keyof TEventMap>(
    event: T,
    callback: (data: TEventMap[T]) => void
  ) {
    if (!this.externalListeners.has(event)) {
      this.externalListeners.set(event, new Set());
    }
    this.externalListeners.get(event)!.add(callback as any);
  }

  public removeExternalListener<T extends keyof TEventMap>(
    event: T,
    callback: (data: TEventMap[T]) => void
  ) {
    this.externalListeners.get(event)!.delete(callback as any);
  }

  public resource<T extends Resource>(ctor: Ctor<T>): T {
    if (!this.resources.has(ctor)) {
      throw new Error(`Failed to fetch resource ${ctor}`);
    }
    return this.resources.get(ctor) as T;
  }

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
    customCtor?: Ctor<Component>
  ): void {
    if (!this.entities.has(entity)) {
      throw new Error(
        `Tried to attach component to non-tracked entity ${entity}`
      );
    }

    const ctor = customCtor ?? (component.constructor as Ctor<Component>);

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

  public get<T extends Ctor<Component>[]>(
    entity: Entity,
    ...componentClasses: T
  ): ExtractComponents<T> {
    const components = this.getComponents(entity);
    return componentClasses.map((componentClass) =>
      components.get(componentClass)
    ) as ExtractComponents<T>;
  }

  public has(entity: Entity, ...componentClasses: Ctor<Component>[]) {
    const components = this.getComponents(entity);
    return componentClasses.every((componentClass) =>
      components.get(componentClass)
    );
  }

  public query(): Query {
    return new Query([...this.entities.keys()], this);
  }

  public queryAll(...componentClasses: Ctor<Component>[]) {
    return new Query([...this.entities.keys()], this)
      .has(...componentClasses)
      .findAll();
  }

  public removeComponent(entity: Entity, componentClass: Function): void {
    if (!this.entities.has(entity)) {
      throw new Error(`Tried remove component of non-tracked entity ${entity}`);
    }
    this.entities.get(entity)!.delete(componentClass);
    this.checkE(entity);
  }

  public addSystem(system: System<TWorld>): void {
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
    const event = system.event;
    if (!this.eventSystems.has(event)) {
      this.eventSystems.set(event, new Set());
    }
    this.eventSystems.get(event)!.add(system);
  }

  public removeEventSystem(
    system: EventSystem<keyof TEventMap, TEventMap, TWorld>
  ) {
    this.eventSystems.get(system.event)!.delete(system);
  }

  /**
   * System will be run once on the first frame of the ecs loop
   */
  public addStartupSystem(system: StartupSystem) {
    this.startupSystems.push(system);
  }

  public update(deltaTime: number): void {
    if (this.midframe) {
      console.warn('ECS skipped colliding frame');
      return;
    }
    this.midframe = true;

    this.deltaTime = deltaTime;
    this.frameId++;

    for (let [system, entities] of this.systems.entries()) {
      system.runAll(this, entities);
    }

    while (this.entitiesToDestroy.length > 0) {
      this.destroyEntity(this.entitiesToDestroy.shift()!);
    }

    while (this.spawners.length > 0) {
      this.spawners.shift()!();
    }

    while (this.startupSystems.length > 0) {
      const system = this.startupSystems.shift()!;
      system.run(this);
    }

    this.midframe = false;
  }

  private destroyEntity(entity: Entity): void {
    [...this.systems.entries()].forEach(([system, entitySet]) => {
      system.removed(this, entity);
      entitySet.delete(entity);
    });
    this.entities.get(entity)?.dispose();
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
    if (have.hasAll(need) || need.size === 0) {
      if (!this.systems.get(system)!.has(entity)) {
        this.systems.get(system)!.add(entity);
        system.added(this, entity);
      }
    } else {
      if (this.systems.get(system)!.has(entity)) {
        system.removed(this, entity);
        this.systems.get(system)!.delete(entity);
      }
    }
  }

  /**
   * Immediate create an entity from the components and add
   * it to the world.
   *
   * Should only be used within startup systems.
   */
  public createAndSpawnImmediate(
    ...components: (Component | [Component, Ctor<Component>])[]
  ) {
    const eid = this.addEntity();
    components.forEach((component) => {
      if (Array.isArray(component)) {
        return this.addComponent(eid, component[0], component[1]);
      }
      return this.addComponent(eid, component);
    });
    return this.spawn(eid);
  }

  /**
   * Schedule creation and spawning of an entity from the components.
   *
   * Runs in the next frame.
   */
  public createAndSpawn(
    ...components: (Component | [Component, Ctor<Component>])[]
  ) {
    this.spawners.push(() => this.createAndSpawnImmediate(...components));
  }

  /**
   * Adds the entity into the world.
   */
  public spawn(entity: number) {
    for (let [system] of this.systems.entries()) {
      const have = this.entities.get(entity)!;
      const need = system.components;
      if (have.hasAll(need)) {
        system.added(this, entity);
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
