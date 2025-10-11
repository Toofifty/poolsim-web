import { Object3D } from 'three';
import { OverlayRenderable } from './overlay-renderable';

export class OverlayBillboardRenderable extends OverlayRenderable {
  public billboard: Object3D;

  constructor(public mesh: Object3D, outline = false) {
    const billboard = new Object3D();
    super(billboard, outline);
    this.billboard = billboard;
    this.billboard.add(mesh);
  }
}
