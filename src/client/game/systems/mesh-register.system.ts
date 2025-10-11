import type { Scene } from 'three';
import { ECS, System, type Entity } from '../../../common/ecs';
import { Renderable } from '../components/renderable';
import type { Game } from '../game';

export class MeshRegisterSystem extends System<Game> {
  public components: Set<Function> = new Set([]);

  constructor(private scene: Scene) {
    super();
  }

  public added(ecs: ECS<any, Game>, entity: Entity): void {
    const components = ecs.getComponents(entity);
    for (const component of components.values()) {
      if (component instanceof Renderable) {
        this.scene.add(component.mesh);
      }
    }
  }

  public removed(ecs: ECS<any, Game>, entity: Entity): void {
    const components = ecs.getComponents(entity);
    for (const component of components.values()) {
      if (component instanceof Renderable) {
        this.scene.remove(component.mesh);
      }
    }
  }
}
