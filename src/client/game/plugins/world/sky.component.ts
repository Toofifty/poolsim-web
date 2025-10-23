import { MathUtils, Vector3 } from 'three';
import { Sky as Sky3 } from 'three/examples/jsm/Addons.js';
import { Renderable } from '../../components/renderable';

export class Sky extends Renderable {
  public static create() {
    const sky = new Sky3();
    sky.scale.setScalar(45000);
    const phi = MathUtils.degToRad(190);
    const theta = MathUtils.degToRad(45);
    const sunPosition = new Vector3().setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms.sunPosition.value = sunPosition;
    sky.material.uniforms.up.value = new Vector3(0, 0, 1);
    return new Renderable(sky);
  }
}
