import { Quaternion, type Vector3 } from 'three';

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
