import {
  BackSide,
  BoxGeometry,
  Mesh,
  ShaderMaterial,
  UniformsUtils,
} from 'three';
import { Sky } from 'three/examples/jsm/Addons.js';

export class SkyZ extends Mesh {
  constructor() {
    const shader = Sky.SkyShader as any;

    const material = new ShaderMaterial({
      name: 'SkyZShader',
      fragmentShader: shader.fragmentShader.replace(
        'const vec3 UP = vec3(0.0, 1.0, 0.0);',
        'const vec3 UP = vec3(0.0, 0.0, 1.0);'
      ),
      vertexShader: shader.vertexShader,
      uniforms: UniformsUtils.clone(shader.uniforms),
      side: BackSide,
      depthWrite: false,
    });

    super(new BoxGeometry(1, 1, 1), material);
  }
}
