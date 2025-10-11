import type { Object3D } from 'three';
import { ECSComponent } from '../../../common/ecs';

export class OverlayRenderable extends ECSComponent {
  public readonly isRenderable = true;

  constructor(public mesh: Object3D, public outline = false) {
    super();
  }
}
