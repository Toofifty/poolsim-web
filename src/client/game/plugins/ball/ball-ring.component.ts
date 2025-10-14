import { Mesh, TorusGeometry, type MeshPhysicalMaterial } from 'three';
import { OverlayBillboardRenderable } from '../../components/overlay-billboard-renderable';
import { createMaterial } from '../../rendering/create-material';
import type { Physics } from '../physics/physics.component';

const width = 0.002;

/**
 * Debug ball ring for debugging physics state
 */
export class BallRing extends OverlayBillboardRenderable {
  constructor(public ring: Mesh, public material: MeshPhysicalMaterial) {
    super(ring);
  }

  public static create(ball: Physics) {
    const material = createMaterial({
      depthTest: false,
      color: 0xffffff,
    });
    const ring = new Mesh(
      new TorusGeometry(ball.R - width / 2, width),
      material
    );
    return new BallRing(ring, material);
  }
}
