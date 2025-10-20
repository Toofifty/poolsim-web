import { defaultParams } from '@common/simulation/physics';
import { Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';
import { Renderable } from '../../components/renderable';

export class PlaneMesh extends Renderable {
  public static create() {
    const mesh = new Mesh(
      new PlaneGeometry(
        defaultParams.table.length * 3,
        defaultParams.table.width * 3
      ),
      new MeshBasicMaterial({ color: '#fff' })
    );
    mesh.visible = false;

    return new PlaneMesh(mesh);
  }
}
