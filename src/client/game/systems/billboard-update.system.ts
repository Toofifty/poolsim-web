import { createSystem } from '@common/ecs/func';
import type { Camera } from 'three';
import { OverlayBillboardRenderable } from '../components/overlay-billboard-renderable';

// todo: optimize

export const createBillboardUpdateSystem = (camera: Camera) =>
  createSystem([], (ecs, entity) => {
    const components = ecs.getComponents(entity);
    for (const component of components.values()) {
      if (component instanceof OverlayBillboardRenderable) {
        component.mesh.quaternion.copy(camera.quaternion);
      }
    }
  });
