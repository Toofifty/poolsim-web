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
    private darkOutlineScene: Scene,
    private lightOutlineScene: Scene,
    private redOutlineScene: Scene,
    private darkOutlines: Object3D[],
    private lightOutlines: Object3D[],
    private redOutlines: Object3D[]
  ) {
    super();
  }

  private getOutlineScene(color: 'light' | 'dark' | 'red' = 'dark') {
    return color === 'light'
      ? this.lightOutlineScene
      : color === 'red'
      ? this.redOutlineScene
      : this.darkOutlineScene;
  }

  private getOutlinesArray(color: 'light' | 'dark' | 'red' = 'dark') {
    return color === 'light'
      ? this.lightOutlines
      : color === 'red'
      ? this.redOutlines
      : this.darkOutlines;
  }

  public added(ecs: ECS, entity: Entity, component: OverlayRenderable): void {
    if (component.config.outline) {
      this.getOutlineScene(component.config.outlineColor).add(component.mesh);
      this.getOutlinesArray(component.config.outlineColor).push(component.mesh);
    } else {
      this.scene.add(component.mesh);
    }
  }

  public removed(
    ecs: ECS<any, Game>,
    entity: Entity,
    component: OverlayRenderable
  ): void {
    if (component.config.outline) {
      this.getOutlineScene(component.config.outlineColor).remove(
        component.mesh
      );

      const arr = this.getOutlinesArray(component.config.outlineColor);
      const index = arr.indexOf(component.mesh);
      if (index === -1) {
        throw new Error('Tried to remove outline from non-outlined mesh');
      }
      arr.splice(index, 1);
    } else {
      this.scene.remove(component.mesh);
    }
  }
}
