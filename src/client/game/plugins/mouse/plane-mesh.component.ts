import { defaultParams } from '@common/simulation/physics';
import { Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';
import { Object3DComponent } from '../../components/mesh';

export class PlaneMesh extends Object3DComponent {
  public static create() {
    const mesh = new Mesh(
      new PlaneGeometry(
        defaultParams.table.length * 3,
        defaultParams.table.width * 3
      ),
      new MeshBasicMaterial({ color: '#fff' })
    );
    mesh.position.z = -defaultParams.ball.radius;
    mesh.visible = false;

    return new PlaneMesh(mesh);
  }
}
