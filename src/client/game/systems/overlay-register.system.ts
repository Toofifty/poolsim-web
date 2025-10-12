import type { Object3D, Scene } from 'three';
import {
  ComponentTrackingSystem,
  ECS,
  ECSComponent,
  type Entity,
} from '../../../common/ecs';
import { OverlayRenderable } from '../components/overlay-renderable';
import type { Game } from '../game';

export class OverlayRegisterSystem extends ComponentTrackingSystem<OverlayRenderable> {
  public predicate: (
    component: ECSComponent
  ) => component is OverlayRenderable = (component) =>
    component instanceof OverlayRenderable;

  constructor(
    private scene: Scene,
    private darkOutlines: Object3D[],
    private lightOutlines: Object3D[],
    private redOutlines: Object3D[]
  ) {
    super();
  }

  private getOutlinesArray(color: 'light' | 'dark' | 'red' = 'dark') {
    return color === 'light'
      ? this.lightOutlines
      : color === 'red'
      ? this.redOutlines
      : this.darkOutlines;
  }

  public added(ecs: ECS, entity: Entity, component: OverlayRenderable): void {
    this.scene.add(component.mesh);
    if (component.config.outline) {
      this.getOutlinesArray(component.config.outlineColor).push(component.mesh);
    }
  }

  public removed(
    ecs: ECS<any, Game>,
    entity: Entity,
    component: OverlayRenderable
  ): void {
    this.scene.remove(component.mesh);
    if (component.config.outline) {
      const arr = this.getOutlinesArray(component.config.outlineColor);

      const index = arr.indexOf(component.mesh);
      if (index === -1) {
        throw new Error('Tried to remove outline from non-outlined mesh');
      }
      arr.splice(index, 1);
    }
  }
}
