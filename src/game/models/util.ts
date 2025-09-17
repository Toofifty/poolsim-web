import {
  ExtrudeGeometry,
  Float32BufferAttribute,
  Shape,
  Vector3,
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

export const combine = (...gs: BufferGeometry[]) => {
  if (gs.length < 2) {
    return gs[0];
  }
  const [first, ...rest] = gs.map((g) => new Brush(g));
  const evaluator = new Evaluator();
  return rest.reduce(
    (combination, brush) => evaluator.evaluate(combination, brush, ADDITION),
    first
  ).geometry;
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

export const fixUVs = (geometry: BufferGeometry) => {
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox!;

  const uv = geometry.attributes.uv;
  const position = geometry.attributes.position;

  for (let i = 0; i < uv.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);

    const u = (x - bbox.min.x) / (bbox.max.x - bbox.min.x);
    const v = (y - bbox.min.y) / (bbox.max.y - bbox.min.y);
    uv.setXY(i, u, v);
  }

  uv.needsUpdate = true;
};

export const generateUVs = (
  geometry: BufferGeometry,
  positions: Float32Array
) => {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const size = new Vector3();
  box.getSize(size);

  const uvs = [];
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    // pick a projection plane — here XY
    uvs.push((x - box.min.x) / size.x);
    uvs.push((y - box.min.y) / size.y);
  }
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
};
