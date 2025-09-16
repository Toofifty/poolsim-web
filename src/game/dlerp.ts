import { lerp } from 'three/src/math/MathUtils.js';
import { Game } from './game';
import type { Vector3 } from 'three';

class Deferred<T = void> {
  public promise: Promise<T>;
  public resolve!: (v: T) => void;
  public reject!: (reason?: any) => void;
  constructor() {
    this.promise = new Promise((res, rej) => {
      this.resolve = res;
      this.reject = rej;
    });
  }
}

export const dlerp = (
  setter: (value: number) => void,
  from: number,
  to: number,
  duration: number
) => {
  const deferred = new Deferred();
  let t = 0;

  const lerpFn = (dt: number) => {
    t += (dt * 1000) / duration;
    if (t >= 1) {
      setter(to);
      Game.instance.lerps.delete(lerpFn);
      deferred.resolve();
      return;
    }
    setter(lerp(from, to, t));
  };

  Game.instance.lerps.add(lerpFn);

  return deferred.promise;
};

export const dvlerp = (
  setter: (value: Vector3) => void,
  from: Vector3,
  to: Vector3,
  duration: number
) => {
  const deferred = new Deferred();
  let t = 0;

  const lerpFn = (dt: number) => {
    t += (dt * 1000) / duration;
    if (t >= 1) {
      setter(to);
      Game.instance.lerps.delete(lerpFn);
      deferred.resolve();
      return;
    }
    setter(from.clone().lerp(to, t));
  };

  Game.instance.lerps.add(lerpFn);

  return deferred.promise;
};
