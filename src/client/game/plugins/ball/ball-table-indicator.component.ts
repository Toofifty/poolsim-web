import { Mesh, RingGeometry, type MeshPhysicalMaterialParameters } from 'three';
import { Renderable } from '../../components/renderable';
import { createMaterial } from '../../rendering/create-material';

export class BallTableIndicator extends Renderable {
  public static create({
    radius,
    color,
  }: {
    radius: number;
    color: MeshPhysicalMaterialParameters['color'];
  }) {
    const mesh = new Mesh(
      new RingGeometry(radius * 0.9, radius),
      createMaterial({ color })
    );
    mesh.receiveShadow = true;
    mesh.visible = false;
    return new BallTableIndicator(mesh);
  }
}
