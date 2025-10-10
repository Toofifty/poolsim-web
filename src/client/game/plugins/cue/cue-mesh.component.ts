import { defaultParams } from '@common/simulation/physics';
import { Object3D } from 'three';
import { Object3DComponent } from '../../components/mesh';
import { createCueMeshes } from '../../models/cue/create-cue-meshes';
import { makeTheme } from '../../store/theme';

export class CueMesh extends Object3DComponent {
  constructor(
    /** parent (attached to target ball) */
    public mesh: Object3D,
    /** vertical lift */
    public lift: Object3D,
    /** visible mesh */
    public cue: Object3D
  ) {
    super(mesh);
  }

  public getObject3DComponent() {
    return new Object3DComponent(this.mesh);
  }

  public static create() {
    const { lift, cue } = createCueMeshes(defaultParams, makeTheme());
    const parent = new Object3D();
    parent.add(lift);
    return new CueMesh(parent, lift, cue);
  }
}
