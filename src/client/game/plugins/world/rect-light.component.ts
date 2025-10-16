import { Object3D, RectAreaLight, SpotLight, SpotLightHelper } from 'three';
import { RectAreaLightHelper } from 'three/examples/jsm/Addons.js';
import { subscribe } from 'valtio';
import { Renderable } from '../../components/renderable';
import { settings } from '../../store/settings';

const Z = 1;

export class RectLight extends Renderable {
  public static create({
    x = 0,
    y = 0,
    w,
    h,
    intensity,
  }: {
    x?: number;
    y?: number;
    w: number;
    h: number;
    intensity: number;
  }) {
    const parent = new Object3D();
    parent.position.z = Z;

    const ral = new RectAreaLight(0xfff1e0, intensity, w, h);
    ral.position.set(x, y, 0);
    parent.add(ral);
    const ralh = new RectAreaLightHelper(ral);
    parent.add(ralh);
    const sl = new SpotLight(0xfff1e0, 1);
    sl.decay = 2;
    sl.castShadow = true;
    sl.shadow.bias = -0.00000000005;
    sl.shadow.mapSize.set(2048, 2048);
    sl.shadow.camera.near = 0.1;
    sl.shadow.camera.far = 5;
    sl.position.set(x, y, 1);
    sl.target.position.set(x, y, 0);
    sl.target.updateMatrixWorld();
    parent.add(sl);
    const slh = new SpotLightHelper(sl);
    parent.add(slh);

    ralh.visible = false;
    slh.visible = false;
    subscribe(settings, () => {
      ralh.visible = settings.debugLights;
      slh.visible = settings.debugLights;
    });

    return new RectLight(parent);
  }
}
