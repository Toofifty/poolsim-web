import {
  BufferAttribute,
  ExtrudeGeometry,
  Shape,
  Vector3,
  type BufferGeometry,
  type ExtrudeGeometryOptions,
} from 'three';
import { ADDITION, Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';

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

export const createRoundedRectShape = (
  width: number,
  height: number,
  radius: number
) => {
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

  return shape;
};

export const createRoundedRect = (
  width: number,
  height: number,
  radius: number,
  extrudeOptions: ExtrudeGeometryOptions
): BufferGeometry =>
  new ExtrudeGeometry(
    createRoundedRectShape(width, height, radius),
    extrudeOptions
  );

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

export function generateBoundingBoxUVs(geometry: BufferGeometry) {
  // Make a copy if needed
  const geom = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = geom.getAttribute('position');

  // Compute bounding box
  geom.computeBoundingBox();
  const bbox = geom.boundingBox!;
  const size = new Vector3();
  bbox.getSize(size);

  const uvArray = new Float32Array(pos.count * 2);

  for (let i = 0; i < pos.count; i++) {
    const absSize = [size.x, size.y, size.z];
    const axes = ['x', 'y', 'z'] as const;
    const sorted = absSize
      .map((s, idx) => ({ size: s, axis: axes[idx] }))
      .sort((a, b) => b.size - a.size);

    const uAxis = sorted[0].axis;
    const vAxis = sorted[1].axis;

    const u =
      (pos.getComponent(i, axes.indexOf(uAxis)) - bbox.min[uAxis]) /
      size[uAxis];
    const v =
      (pos.getComponent(i, axes.indexOf(vAxis)) - bbox.min[vAxis]) /
      size[vAxis];

    const uInset = 0.1;
    const vInset = 0.1;

    uvArray[i * 2] = u * (1 - 2 * uInset) + uInset;
    uvArray[i * 2 + 1] = v * (1 - 2 * vInset) + vInset;
  }

  geom.setAttribute('uv', new BufferAttribute(uvArray, 2));
  return geom;
}
