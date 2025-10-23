import { lerp } from 'three/src/math/MathUtils.js';

export const lerpAngle = (from: number, to: number, t: number) => {
  const shortestAngle =
    from + ((to - from + Math.PI) % (2 * Math.PI)) - Math.PI;
  return lerp(from, shortestAngle, t);
};
