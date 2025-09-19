import { Quaternion, type Vector3 } from 'three';
import { vec, type Vec } from './physics/vec';

export const constrain = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

export const triangulateConvexPolygon = (vertices: Vector3[]) => {
  if (vertices.length < 3) return [];
  const tris: Vector3[] = [];
  for (let i = 1; i < vertices.length - 1; i++) {
    tris.push(vertices[0].clone());
    tris.push(vertices[i].clone());
    tris.push(vertices[i + 1].clone());
  }
  return tris;
};

export const flatternVertices = (vertices: Vector3[]) =>
  vertices.flatMap((vertex) => [vertex.x, vertex.y, vertex.z]);

export const randomQuaternion = () => {
  const u1 = Math.random();
  const u2 = Math.random();
  const u3 = Math.random();

  const sqrt1MinusU1 = Math.sqrt(1 - u1);
  const sqrtU1 = Math.sqrt(u1);

  const q = new Quaternion(
    sqrt1MinusU1 * Math.sin(2 * Math.PI * u2),
    sqrt1MinusU1 * Math.cos(2 * Math.PI * u2),
    sqrtU1 * Math.sin(2 * Math.PI * u3),
    sqrtU1 * Math.cos(2 * Math.PI * u3)
  );
  return q;
};

export const solveRelativeMotion = (
  p1: Vec,
  v1: Vec,
  r1: number,
  p2: Vec,
  v2: Vec,
  r2: number
) => {
  const p = vec.sub(p1, p2);
  const v = vec.sub(v1, v2);
  const r = r1 + r2;

  const a = vec.dot(v, v);
  const b = 2 * vec.dot(p, v);
  const c = vec.dot(p, p) - r * r;

  if (a === 0) {
    return Infinity;
  }

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    return Infinity;
  }

  const rd = Math.sqrt(discriminant);
  const t1 = (-b - rd) / (2 * a);
  const t2 = (-b + rd) / (2 * a);

  if (t1 >= 0 && t2 >= 0) return Math.min(t1, t2);
  if (t1 >= 0) return t1;
  if (t2 >= 0) return t2;

  return Infinity;
};
