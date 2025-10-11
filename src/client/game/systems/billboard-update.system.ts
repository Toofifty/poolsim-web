import { ECS, System, type Entity } from '@common/ecs';
import type { Camera } from 'three';
import { OverlayBillboardRenderable } from '../components/overlay-billboard-renderable';

// todo: optimize

export class BillboardUpdateSystem extends System {
  public components: Set<Function> = new Set([]);

  constructor(private camera: Camera) {
    super();
  }

  public run(ecs: ECS<any, unknown>, entity: Entity): void {
    const components = ecs.getComponents(entity);
    for (const component of components.values()) {
      if (component instanceof OverlayBillboardRenderable) {
        component.mesh.quaternion.copy(this.camera.quaternion);
      }
    }
  }
}
