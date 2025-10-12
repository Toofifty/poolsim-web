import type { Vec } from '@common/math';
import { defaultParams } from '@common/simulation/physics';
import { Mesh, SphereGeometry } from 'three';
import { OverlayBillboardRenderable } from '../../components/overlay-billboard-renderable';
import { createMaterial } from '../../rendering/create-material';
import { toVector3 } from '../../util/three-interop';

const width = 0.05;

export class BallHighlight extends OverlayBillboardRenderable {
  constructor(public ring: Mesh, color?: 'light' | 'dark' | 'red') {
    super(ring, {
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
    const ring = new Mesh(
      new SphereGeometry(ball.radius),
      createMaterial({
        depthTest: false,
        transparent: true,
        opacity: 0,
        color: 0xffffff,
      })
    );
    ring.position.copy(toVector3(position));
    return new BallHighlight(ring, color);
  }
}
