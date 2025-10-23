import type { Object3D } from 'three';
import { ECSComponent } from '../../../common/ecs';

export type OverlayRenderableConfig = {
  outline?: boolean;
  outlineColor?: 'light' | 'dark' | 'red';
};

export class OverlayRenderable extends ECSComponent {
  public readonly isRenderable = true;

  constructor(
    public mesh: Object3D,
    public config: OverlayRenderableConfig = {}
  ) {
    super();
  }
}
