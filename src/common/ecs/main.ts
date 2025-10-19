import { Profiler, type IProfiler } from '@common/util/profiler';
import {
  type Ctor,
  type ECSComponent,
  type ExtractComponents,
} from './component';
import type { ComponentTrackingSystem } from './component-tracking-system';
import { EventSystem } from './event-system';
import { Query } from './query';
import type { Resource } from './resource';
import type { StartupSystem } from './startup-system';
import type { System } from './system';
import type { Entity } from './types';

export class ComponentContainer {
  private map = new Map<Function, ECSComponent>();

  public add(component: ECSComponent, ctor?: Function): void {
    this.map.set(ctor ?? component.constructor, component);
  }

  public get<T extends ECSComponent>(componentClass: Ctor<T>): T {
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

  public values(): MapIterator<ECSComponent> {
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

export class ECS<TEventMap extends Record<string, any>, TWorld = unknown> {
  private entities = new Map<Entity, ComponentContainer>();
  private systems = new Map<System<TWorld>, Set<Entity>>();
  private fixedUpdateSystems = new Map<System<TWorld>, Set<Entity>>();
  private eventSystems = new Map<
    keyof TEventMap,
    Set<EventSystem<keyof TEventMap, TEventMap, TWorld>>
  >();
  private startupSystems: StartupSystem[] = [];
  private componentTrackingSystems: Set<ComponentTrackingSystem<ECSComponent>> =
    new Set();
  private resources = new Map<Ctor<Resource>, Resource>();
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

  public game!: TWorld;

  constructor(private profiler: IProfiler = Profiler.none) {}

  public emit<T extends keyof TEventMap>(event: T, data: TEventMap[T]) {
    const systems = this.eventSystems.get(event);
    if (systems) {
      systems.forEach((system) => system.run(this, data));
    }

    const externalListeners = this.externalListeners.get(event);
    if (externalListeners) {
      externalListeners.forEach((callback) => callback(data));
    }
  }

  public addResource<T extends Resource>(resource: T): T {
    this.resources.set(resource.constructor as Ctor<T>, resource);
    return resource;
  }

  public removeResource<T extends Resource>(resource: T): void {
    this.resources.delete(resource.constructor as Ctor<T>);
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
    component: ECSComponent,
    customCtor?: Ctor<ECSComponent>
  ): void {
    if (!this.entities.has(entity)) {
      throw new Error(
        `Tried to attach component to non-tracked entity ${entity}`
      );
    }

    const ctor = customCtor ?? (component.constructor as Ctor<ECSComponent>);

    this.entities.get(entity)!.add(component, ctor);
    this.componentTrackingSystems.forEach((system) => {
      if (system.predicate(component)) {
        system.added(this, entity, component);
      }
    });
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

  public get<T extends Ctor<ECSComponent>[]>(
    entity: Entity,
    ...componentClasses: T
  ): ExtractComponents<T> {
    const components = this.getComponents(entity);
    return componentClasses.map((componentClass) =>
      components.get(componentClass)
    ) as ExtractComponents<T>;
  }

  public has(entity: Entity, ...componentClasses: Ctor<ECSComponent>[]) {
    const components = this.getComponents(entity);
    return componentClasses.every((componentClass) =>
      components.get(componentClass)
    );
  }

  public query(): Query {
    return new Query([...this.entities.keys()], this);
  }

  public queryAll(...componentClasses: Ctor<ECSComponent>[]) {
    return new Query([...this.entities.keys()], this)
      .has(...componentClasses)
      .findAll();
  }

  public removeComponent(
    entity: Entity,
    componentClass: Ctor<ECSComponent>
  ): void {
    if (!this.entities.has(entity)) {
      throw new Error(`Tried remove component of non-tracked entity ${entity}`);
    }
    const component = this.get(entity, componentClass)[0];
    this.componentTrackingSystems.forEach((system) => {
      if (system.predicate(component)) {
        system.removed(this, entity, component);
      }
    });
    component.dispose();
    this.entities.get(entity)!.delete(componentClass);
    this.checkE(entity);
  }

  public addSystem<T extends System<TWorld>>(system: T): T {
    this.systems.set(system, new Set());
    for (let entity of this.entities.keys()) {
      this.checkES(entity, system, this.systems.get(system)!);
    }
    return system;
  }

  public addFixedUpdateSystem<T extends System<TWorld>>(system: T): T {
    this.fixedUpdateSystems.set(system, new Set());
    for (let entity of this.entities.keys()) {
      this.checkES(entity, system, this.fixedUpdateSystems.get(system)!);
    }
    return system;
  }

  public removeSystem(system: System<TWorld>): void {
    this.systems.delete(system);
    this.fixedUpdateSystems.delete(system);
  }

  public addComponentTrackingSystem<
    T extends ComponentTrackingSystem<ECSComponent>
  >(system: T): T {
    this.componentTrackingSystems.add(system);
    return system;
  }

  public removeComponentTrackingSystem(
    system: ComponentTrackingSystem<ECSComponent>
  ) {
    this.componentTrackingSystems.delete(system);
  }

  public addEventSystem<
    T extends EventSystem<keyof TEventMap, TEventMap, TWorld>
  >(system: T): T {
    const event = system.event;
    if (!this.eventSystems.has(event)) {
      this.eventSystems.set(event, new Set());
    }
    this.eventSystems.get(event)!.add(system);
    return system;
  }

  public removeEventSystem(
    system: EventSystem<keyof TEventMap, TEventMap, TWorld>
  ) {
    this.eventSystems.get(system.event)!.delete(system);
  }

  /**
   * System will be run once on the first frame of the ecs loop,
   * and will be destroyed
   */
  public addStartupSystem<T extends StartupSystem>(system: T): void {
    this.startupSystems.push(system);
  }

  public fixedUpdate(deltaTime: number): void {
    this.deltaTime = deltaTime;
    const end = this.profiler.start('ecs-fixedupdate');

    this.profiler.profile('system-calls', () => {
      for (let [system, entities] of this.fixedUpdateSystems.entries()) {
        this.profiler.profile('system', () => {
          system.runAll(this, entities);
        });
      }
    });

    end();
  }

  public update(deltaTime: number): void {
    if (this.midframe) {
      console.warn('ECS skipped colliding frame');
      return;
    }
    this.midframe = true;

    const end = this.profiler.start('ecs-update');

    this.deltaTime = deltaTime;
    this.frameId++;

    this.profiler.profile('system-calls', () => {
      for (let [system, entities] of this.systems.entries()) {
        this.profiler.profile('system', () => {
          system.runAll(this, entities);
        });
      }
    });

    while (this.entitiesToDestroy.length > 0) {
      this.profiler.profile('entity-destroy', () => {
        this.destroyEntity(this.entitiesToDestroy.shift()!);
      });
    }

    while (this.spawners.length > 0) {
      this.profiler.profile('spawner', () => {
        this.spawners.shift()!();
      });
    }

    while (this.startupSystems.length > 0) {
      this.profiler.profile('startup-system-call', () => {
        const system = this.startupSystems.shift()!;
        system.run(this);
      });
    }

    this.midframe = false;

    end();
  }

  private destroyEntity(entity: Entity): void {
    [...this.systems.entries(), ...this.fixedUpdateSystems.entries()].forEach(
      ([_, entitySet]) => {
        entitySet.delete(entity);
      }
    );
    const components = this.getComponents(entity);
    this.componentTrackingSystems.forEach((system) => {
      for (const component of components.values()) {
        if (system.predicate(component)) {
          system.removed(this, entity, component);
        }
      }
    });
    this.entities.get(entity)?.dispose();
    this.entities.delete(entity);
  }

  private checkE(entity: Entity): void {
    for (let [system, systemEntities] of this.systems) {
      this.checkES(entity, system, systemEntities);
    }
    for (let [system, systemEntities] of this.fixedUpdateSystems) {
      this.checkES(entity, system, systemEntities);
    }
  }

  private checkES(
    entity: Entity,
    system: System<TWorld>,
    systemEntities: Set<Entity>
  ): void {
    if (!this.entities.has(entity)) {
      throw new Error(`Tried check systems of non-tracked entity ${entity}`);
    }

    const have = this.entities.get(entity)!;
    const need = system.components;
    if (have.hasAll(need) || need.size === 0) {
      if (!systemEntities.has(entity)) {
        systemEntities.add(entity);
      }
    } else {
      if (systemEntities.has(entity)) {
        systemEntities.delete(entity);
      }
    }
  }

  /**
   * Immediate create an entity from the components and add
   * it to the world.
   *
   * Should only be used within startup systems.
   */
  public spawnImmediate(
    ...components: (ECSComponent | [ECSComponent, Ctor<ECSComponent>])[]
  ) {
    const eid = this.addEntity();
    components.forEach((component) => {
      if (Array.isArray(component)) {
        return this.addComponent(eid, component[0], component[1]);
      }
      return this.addComponent(eid, component);
    });
    return eid;
  }

  /**
   * Schedule creation and spawning of an entity from the components.
   *
   * Runs in the next frame.
   */
  public spawn(
    ...components: (ECSComponent | [ECSComponent, Ctor<ECSComponent>])[]
  ) {
    this.spawners.push(() => this.spawnImmediate(...components));
  }

  public debug(entity: number) {
    if (!this.entities.has(entity)) {
      throw new Error(`Tried to debug non-tracked entity ${entity}`);
    }
  }
}
