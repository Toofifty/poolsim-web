import type { BufferGeometry } from 'three';
import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';

export const subtract = (g1: BufferGeometry, g2: BufferGeometry) => {
  return new Evaluator().evaluate(new Brush(g1), new Brush(g2), SUBTRACTION)
    .geometry;
};
