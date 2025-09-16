import {
  ExtrudeGeometry,
  Shape,
  type BufferGeometry,
  type ExtrudeGeometryOptions,
} from 'three';
import { SUBTRACTION, Brush, Evaluator, ADDITION } from 'three-bvh-csg';

export const subtract = (g1: BufferGeometry, g2: BufferGeometry) => {
  return new Evaluator().evaluate(new Brush(g1), new Brush(g2), SUBTRACTION)
    .geometry;
};
export const add = (g1: BufferGeometry, g2: BufferGeometry) => {
  return new Evaluator().evaluate(new Brush(g1), new Brush(g2), ADDITION)
    .geometry;
};

export const createRoundedRect = (
  width: number,
  height: number,
  radius: number,
  extrudeOptions: ExtrudeGeometryOptions
): BufferGeometry => {
  const shape = new Shape();

  const x = -width / 2;
  const y = -height / 2;

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  return new ExtrudeGeometry(shape, extrudeOptions);
};
