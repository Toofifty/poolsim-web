import type { Vec } from '@common/math';
import { defaultParams } from '@common/simulation/physics';
import { Mesh, SphereGeometry } from 'three';
import { OverlayRenderable } from '../../components/overlay-renderable';
import { createMaterial } from '../../rendering/create-material';
import { toVector3 } from '../../util/three-interop';

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
  }: {
    position: Vec;
    color?: 'light' | 'dark' | 'red';
  }) {
    const { ball } = defaultParams;
    const ghost = new Mesh(
      new SphereGeometry(ball.radius),
      createMaterial({
        depthTest: false,
        transparent: true,
        opacity: 0,
        color: 0xffffff,
      })
    );
    ghost.position.copy(toVector3(position));
    return new BallHighlight(ghost, color);
  }
}
