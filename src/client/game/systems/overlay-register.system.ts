import type { Object3D, Scene } from 'three';
import { ECS, System, type Entity } from '../../../common/ecs';
import { OverlayRenderable } from '../components/overlay-renderable';
import type { Game } from '../game';

export class OverlayRegisterSystem extends System<Game> {
  public components: Set<Function> = new Set([]);

  constructor(private scene: Scene, private outlined: Object3D[]) {
    super();
  }

  public added(ecs: ECS<any, Game>, entity: Entity): void {
    const components = ecs.getComponents(entity);
    for (const component of components.values()) {
      if (component instanceof OverlayRenderable) {
        this.scene.add(component.mesh);
        if (component.outline) {
          this.outlined.push(component.mesh);
        }
      }
    }
  }

  public removed(ecs: ECS<any, Game>, entity: Entity): void {
    const components = ecs.getComponents(entity);
    for (const component of components.values()) {
      if (component instanceof OverlayRenderable) {
        this.scene.remove(component.mesh);
        if (component.outline) {
          const index = this.outlined.indexOf(component.mesh);
          if (index === -1) {
            throw new Error('Tried to remove outline from non-outlined mesh');
          }
          this.outlined.splice(index, 1);
        }
      }
    }
  }
}
