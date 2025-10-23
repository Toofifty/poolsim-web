import type { Object3D } from 'three';
import { ECSComponent } from '../../../common/ecs';

export class Renderable extends ECSComponent {
  public readonly isRenderable = true;

  constructor(public mesh: Object3D) {
    super();
  }
}
