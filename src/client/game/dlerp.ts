import type { Vector3 } from 'three';
import { lerp } from 'three/src/math/MathUtils.js';
import { vec, type Vec } from '../../common/math';
import type { Game } from './game';

export const _dlerpGame = { instance: undefined! as Game };

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
      _dlerpGame.instance.lerps.delete(lerpFn);
      deferred.resolve();
      return;
    }
    setter(lerp(from, to, t));
  };

  _dlerpGame.instance.lerps.add(lerpFn);

  return deferred.promise;
};

/**
 * Assumes radians
 */
export const dlerpAngle = (
  setter: (value: number) => void,
  from: number,
  to: number,
  duration: number
) => {
  const shortestAngle =
    from + ((to - from + Math.PI) % (2 * Math.PI)) - Math.PI;
  return dlerp(setter, from, shortestAngle, duration);
};

export const dlerpVec = (
  setter: (value: Vec) => void,
  from: Vec,
  to: Vec,
  duration: number
) => {
  const deferred = new Deferred();
  let t = 0;

  const lerpFn = (dt: number) => {
    t += (dt * 1000) / duration;
    if (t >= 1) {
      setter(to);
      _dlerpGame.instance.lerps.delete(lerpFn);
      deferred.resolve();
      return;
    }
    setter(vec.lerp(from, to, t));
  };

  _dlerpGame.instance.lerps.add(lerpFn);

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
      _dlerpGame.instance.lerps.delete(lerpFn);
      deferred.resolve();
      return;
    }
    setter(from.clone().lerp(to, t));
  };

  _dlerpGame.instance.lerps.add(lerpFn);

  return deferred.promise;
};
