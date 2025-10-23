import { defaultParams } from '@common/simulation/physics';
import { Object3D } from 'three';
import { Renderable } from '../../components/renderable';
import { createCueMeshes } from '../../models/cue/create-cue-meshes';
import { makeTheme } from '../../store/theme';

export class CueMesh extends Renderable {
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

  public static create() {
    const { lift, cue } = createCueMeshes(defaultParams, makeTheme());
    const parent = new Object3D();
    parent.add(lift);
    return new CueMesh(parent, lift, cue);
  }
}
