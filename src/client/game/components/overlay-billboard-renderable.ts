import { Object3D } from 'three';
import {
  OverlayRenderable,
  type OverlayRenderableConfig,
} from './overlay-renderable';

export class OverlayBillboardRenderable extends OverlayRenderable {
  public billboard: Object3D;

  constructor(public mesh: Object3D, config: OverlayRenderableConfig) {
    const billboard = new Object3D();
    super(billboard, config);
    this.billboard = billboard;
    this.billboard.add(mesh);
  }
}
