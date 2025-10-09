import type { Component, ComponentClass, ExtractComponents } from './component';
import type { ECS } from './main';

export class Query {
  private predicates: ((ecs: ECS, entity: number) => boolean)[] = [];

  constructor(private entities: number[], private ecs: ECS) {}

  public has(...componentClasses: ComponentClass<Component>[]): Query {
    return this.filter((ecs, entity) =>
      ecs.getComponents(entity).has(...componentClasses)
    );
  }

  public hasNot(...componentClasses: ComponentClass<Component>[]): Query {
    return this.filter(
      (ecs, entity) => !ecs.getComponents(entity).has(...componentClasses)
    );
  }

  public with<T extends ComponentClass<Component>[]>(...componentClasses: T) {
    return {
      filter: (
        predicate: (...components: ExtractComponents<T>) => boolean
      ): Query => {
        return this.filter((ecs, entity) => {
          const components = ecs.get(entity, ...componentClasses);
          return predicate(...components);
        });
      },
    };
  }

  public filter(predicate: (ecs: ECS, entity: number) => boolean): Query {
    this.predicates.push(predicate);
    return this;
  }

  public findAll(): number[] {
    return this.predicates.reduce((entities, predicate) => {
      return entities.filter((e) => predicate(this.ecs, e));
    }, this.entities);
  }

  public findOne(): number | undefined {
    return this.predicates.reduce((entities, predicate) => {
      return entities.filter((e) => predicate(this.ecs, e));
    }, this.entities)[0];
  }
}
