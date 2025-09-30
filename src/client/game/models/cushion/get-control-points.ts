import { vec, type Vec } from '../../../../common/math';
import type { Params } from '../../../../common/simulation/physics';

export const getControlPoints = (
  [A, B, C, D]: [Vec, Vec, Vec, Vec],
  params: Params
) => {
  const {
    cushion: { cornerRounding },
  } = params;

  const AB = vec.add(A, vec.mult(vec.sub(B, A), 1 - cornerRounding));
  const curveLen = vec.len(vec.sub(B, AB));
  const BC1 = vec.add(B, vec.mult(vec.norm(vec.sub(C, B)), curveLen));
  const BC2 = vec.add(C, vec.mult(vec.norm(vec.sub(B, C)), curveLen));
  const CD = vec.add(D, vec.mult(vec.sub(C, D), 1 - cornerRounding));

  return [AB, BC1, BC2, CD] as const;
};
