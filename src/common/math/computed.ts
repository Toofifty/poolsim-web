import { compile } from './compiled/compiler';
import { vec, type Vec } from './vec';

const vectorType: Vec = [0, 0, 0];
const numberType: number = 0;

const computeFallbacks = {
  deltaR: (V: Vec, u: number, g: number, t: number) =>
    vec.add(
      vec.mult(V, t),
      vec.mult(vec.mult(vec.norm(V), -u * g), 0.5 * t * t)
    ),
  deltaRU: (V: Vec, U: Vec, u: number, g: number, t: number) =>
    vec.add(
      vec.mult(V, t),
      vec.mult(vec.mult(vec.norm(U), -u * g), 0.5 * t * t)
    ),
  deltaV: (V: Vec, u: number, g: number, t: number) =>
    vec.mult(vec.mult(vec.norm(V), -u * g), t),
  deltaVU: (U: Vec, u: number, g: number, t: number) =>
    vec.mult(vec.mult(vec.norm(U), -u * g), t),
  contactVelocity: (V: Vec, W: Vec, r: number) =>
    vec.add(V, vec.cross(vec.mult(vec.UP, r), W)),
  idealW: (V: Vec, r: number) =>
    vec.mult(vec.norm(vec.cross(vec.UP, V)), vec.len(V) / r),
  deltaW: (U: Vec, r: number, u: number, g: number, t: number) =>
    vec.mult(vec.cross(vec.norm(U), vec.UP), (-5 / (2 * r)) * u * g * t),
};

const computeFunctions = {
  /** velocity, friction, gravity, dt */
  deltaR: compile(
    '(V * t) + ((~V * -u * g) * 0.5 * t * t)',
    ['V', 'u', 'g', 't'] as const,
    vectorType
  ),

  /** velocity, contact velocity, friction, gravity, dt */
  deltaRU: compile(
    '(V * t) + ((~U * -u * g) * 0.5 * t * t)',
    ['V', 'U', 'u', 'g', 't'] as const,
    vectorType
  ),

  /** velocity, friction, gravity, dt */
  deltaV: compile(
    '(~V * -u * g) * t',
    ['V', 'u', 'g', 't'] as const,
    vectorType
  ),

  /** contact velocity, friction, gravity, dt */
  deltaVU: compile(
    '(~U * -u * g) * t',
    ['U', 'u', 'g', 't'] as const,
    vectorType
  ),

  /** velocity, angular velocity, radius */
  contactVelocity: compile(
    'V + ([0, 0, 1] * r) x W',
    ['V', 'W', 'r'] as const,
    vectorType
  ),

  /** velocity, radius */
  idealW: compile(
    '~([0, 0, 1] x V) * (|V| / r)',
    ['V', 'r'] as const,
    vectorType
  ),

  deltaW: compile(
    '(~U x [0, 0, 1]) * (-5 / (2 * r)) * u * g * t',
    ['U', 'r', 'u', 'g', 't'] as const,
    vectorType
  ),
};

export const createCompute = (enabled: boolean): typeof computeFallbacks => {
  return enabled ? computeFunctions : computeFallbacks;
};

const ENABLE_COMPUTE = true;
export const compute = createCompute(ENABLE_COMPUTE);

if (typeof window !== 'undefined') {
  (window as any).compute = compute;
}
