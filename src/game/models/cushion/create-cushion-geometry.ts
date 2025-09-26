import { BufferGeometry, ExtrudeGeometry, Shape } from 'three';
import { generateBoundingBoxUVs } from '../util';
import { vec, type Vec } from '../../physics/math';
import { params } from '../../physics/params';
import { constrain } from '../../math';

export const createCushionGeometry = ([A, B, C, D]: [Vec, Vec, Vec, Vec]) => {
  const {
    cushion: { height, backHeight, width, baseWidth, rounding },
    ball,
  } = params;

  const AB = vec.mult(vec.add(A, B), 1 / 2);
  const AtoAB = vec.len(vec.sub(AB, A));
  const BC1 = vec.add(B, vec.mult(vec.norm(vec.sub(C, B)), AtoAB));
  const BC2 = vec.add(C, vec.mult(vec.norm(vec.sub(B, C)), AtoAB));
  const CD = vec.mult(vec.add(C, D), 1 / 2);

  const shape = new Shape();

  shape.moveTo(A[0], A[1]);
  shape.lineTo(AB[0], AB[1]);
  shape.quadraticCurveTo(B[0], B[1], BC1[0], BC1[1]);
  shape.lineTo(BC2[0], BC2[1]);
  shape.quadraticCurveTo(C[0], C[1], CD[0], CD[1]);
  shape.lineTo(D[0], D[1]);
  shape.lineTo(A[0], A[1]);

  let geometry: BufferGeometry = new ExtrudeGeometry(shape, {
    depth: height - rounding,
    bevelSize: rounding,
    bevelThickness: rounding,
  }).translate(0, 0, -ball.radius + rounding);

  const dNormal = vec.perp(vec.norm(vec.sub(D, A)));
  const d = width - baseWidth;

  geometry.scale(1, 1, 1);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const p = vec.new(position.getX(i), position.getY(i));
    const z = position.getZ(i);
    const offset =
      constrain(Math.min(vec.dist(p, A), vec.dist(p, D)) * 8, 0, 1) * d;

    if (z < -height / 2) {
      const ph = vec.add(p, vec.mult(dNormal, offset));
      position.setX(i, ph[0]);
      position.setY(i, ph[1]);
    }
  }
  position.needsUpdate = true;

  geometry.computeVertexNormals();
  geometry = generateBoundingBoxUVs(geometry);

  return geometry;
};
