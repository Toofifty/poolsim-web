import type { Vec } from '@common/math';
import { Mesh, MeshPhysicalMaterial, SphereGeometry } from 'three';
import { OverlayRenderable } from '../../components/overlay-renderable';
import { createMaterial } from '../../rendering/create-material';
import { toVector3 } from '../../util/three-interop';

const geometry = new SphereGeometry(1, 32, 16);

/**
 * Draws an invisible ball onto the overlay layer with an outline
 */
export class BallHighlight extends OverlayRenderable {
  constructor(public ghost: Mesh, color?: 'light' | 'dark' | 'red') {
    super(ghost, {
      outline: true,
      outlineColor: color,
    });
  }

  public static create({
    position,
    color,
    radius,
  }: {
    position: Vec;
    color?: 'light' | 'dark' | 'red';
    radius: number;
  }) {
    const ghost = new Mesh(
      geometry,
      createMaterial({
        depthTest: false,
        transparent: true,
        opacity: 0,
        color: 0xffffff,
      })
    );
    ghost.scale.set(radius, radius, radius);
    ghost.position.copy(toVector3(position));
    return new BallHighlight(ghost, color);
  }

  public dispose(): void {
    this.ghost.geometry.dispose();
    (this.ghost.material as MeshPhysicalMaterial).dispose();
  }
}
