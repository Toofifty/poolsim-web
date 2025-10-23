import { Mesh, MeshPhysicalMaterial, TorusGeometry } from 'three';
import { OverlayBillboardRenderable } from '../../components/overlay-billboard-renderable';
import { createMaterial } from '../../rendering/create-material';

const width = 0.1;

export class ImpactPointMesh extends OverlayBillboardRenderable {
  constructor(public ring: Mesh, public material: MeshPhysicalMaterial) {
    super(ring, { outline: true });
    ring.visible = false;
  }

  public static create() {
    const ring = new Mesh(
      new TorusGeometry(1 - width / 2, width),
      createMaterial({ roughness: 0.1, metalness: 0, depthTest: false })
    );
    return new ImpactPointMesh(ring, ring.material);
  }
}
