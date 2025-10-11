import { assertExists } from '@common/util';
import type { Component, Ctor, ExtractComponents } from './component';
import type { ECS } from './main';

export class Query {
  private predicates: ((ecs: ECS, entity: number) => boolean)[] = [];

  constructor(private entities: number[], private ecs: ECS) {}

  public has(...componentClasses: Ctor<Component>[]): Query {
    return this.filter((ecs, entity) =>
      ecs.getComponents(entity).has(...componentClasses)
    );
  }

  public hasNot(...componentClasses: Ctor<Component>[]): Query {
    return this.filter(
      (ecs, entity) => !ecs.getComponents(entity).has(...componentClasses)
    );
  }

  public with<T extends Ctor<Component>[]>(...componentClasses: T) {
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

  public firstWith(componentClass: Ctor<Component>): number | undefined {
    if (this.predicates.length > 0) {
      console.warn('Ignoring previous predicates in query.firstWith()');
    }
    return this.entities.find((entity) =>
      this.ecs.getComponents(entity).has(componentClass)
    );
  }

  public resolveFirst<T extends Component>(componentClass: Ctor<T>): T {
    const entity = this.firstWith(componentClass);
    assertExists(
      entity,
      `query.resolveFirst() failed - no entity with ${componentClass.name}`
    );
    const [component] = this.ecs.get(entity, componentClass);
    assertExists(
      component,
      'query.resolveFirst() failed - entity did not have component'
    );
    return component;
  }

  public resolveAll<T extends Component>(componentClass: Ctor<T>): T[] {
    if (this.predicates.length === 0) {
      this.has(componentClass);
    }

    const entites = this.findAll();
    return entites.map((entity) => this.ecs.get(entity, componentClass)).flat();
  }
}
