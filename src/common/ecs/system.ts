import type { ECS } from './main';
import type { Entity } from './types';

export abstract class System<TWorld = unknown> {
  public abstract components: Set<Function>;

  public before(ecs: ECS<any, TWorld>, entities: Set<Entity>): boolean {
    return true;
  }

  public after(ecs: ECS<any, TWorld>, entities: Set<Entity>): void {}

  public runAll(ecs: ECS<any, TWorld>, entities: Set<Entity>): void {
    if (this.before(ecs, entities)) {
      entities.forEach((e) => this.run(ecs, e));
      this.after(ecs, entities);
    }
  }

  public run(ecs: ECS<any, TWorld>, entity: Entity): void {}
}
