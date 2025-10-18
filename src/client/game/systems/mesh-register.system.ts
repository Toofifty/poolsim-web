import { createComponentTrackingSystem } from '@common/ecs/func';
import type { Object3D, Scene } from 'three';
import { OverlayRenderable } from '../components/overlay-renderable';
import { Renderable } from '../components/renderable';

/**
 * Responsible for adding meshes to the normal scene
 */
export const createMeshRegisterSystem = (scene: Scene) =>
  createComponentTrackingSystem(
    (c) => c instanceof Renderable,
    (_, __, component) => scene.add(component.mesh),
    (_, __, component) => scene.remove(component.mesh)
  );

/**
 * Responsible for adding meshes to the overlay scenes
 */
export const createOverlayRegisterSystem = (
  overlay: Scene,
  darkOutlineScene: Scene,
  lightOutlineScene: Scene,
  redOutlineScene: Scene,
  darkOutlines: Object3D[],
  lightOutlines: Object3D[],
  redOutlines: Object3D[]
) => {
  const getOutlineScene = (color: 'light' | 'dark' | 'red' = 'dark') =>
    color === 'light'
      ? lightOutlineScene
      : color === 'red'
      ? redOutlineScene
      : darkOutlineScene;

  const getOutlinesArray = (color: 'light' | 'dark' | 'red' = 'dark') =>
    color === 'light'
      ? lightOutlines
      : color === 'red'
      ? redOutlines
      : darkOutlines;

  return createComponentTrackingSystem(
    (c) => c instanceof OverlayRenderable,
    (_, __, component) => {
      if (component.config.outline) {
        getOutlineScene(component.config.outlineColor).add(component.mesh);
        getOutlinesArray(component.config.outlineColor).push(component.mesh);
      } else {
        overlay.add(component.mesh);
      }
    },
    (_, __, component) => {
      if (component.config.outline) {
        getOutlineScene(component.config.outlineColor).remove(component.mesh);

        const arr = getOutlinesArray(component.config.outlineColor);
        const index = arr.indexOf(component.mesh);
        if (index === -1) {
          throw new Error('Tried to remove outline from non-outlined mesh');
        }
        arr.splice(index, 1);
      } else {
        overlay.remove(component.mesh);
      }
    }
  );
};
