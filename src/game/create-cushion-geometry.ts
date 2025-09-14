import { BufferAttribute, BufferGeometry, Vector3 } from 'three';

export const createCushionGeometry = (vertices: Vector3[], height: number) => {
  const AB = vertices[0].distanceTo(vertices[1]);
  const CD = vertices[2].distanceTo(vertices[3]);

  const shortestEdge =
    AB < CD ? [vertices[0], vertices[1]] : [vertices[2], vertices[3]];
  const longestEdge =
    AB < CD ? [vertices[2], vertices[3]] : [vertices[0], vertices[1]];

  const edgeVec = shortestEdge[1].clone().sub(shortestEdge[0]);
  const perp = new Vector3(-edgeVec.y, edgeVec.x, 0).normalize();

  const widthVec = longestEdge[0].clone().sub(shortestEdge[0]);
  const cushionWidth = widthVec.dot(perp);

  const bottomEdge = [
    shortestEdge[0]
      .clone()
      .add(perp.clone().multiplyScalar(cushionWidth))
      .add(new Vector3(0, 0, -height)),
    shortestEdge[1]
      .clone()
      .add(perp.clone().multiplyScalar(cushionWidth))
      .add(new Vector3(0, 0, -height)),
  ];

  const A = shortestEdge[0];
  const B = shortestEdge[1];
  const C = longestEdge[0];
  const D = longestEdge[1];
  const E = bottomEdge[0];
  const F = bottomEdge[1];

  // Build position array
  const positions = new Float32Array([
    A.x,
    A.y,
    A.z, // 0
    B.x,
    B.y,
    B.z, // 1
    C.x,
    C.y,
    C.z, // 2
    D.x,
    D.y,
    D.z, // 3
    E.x,
    E.y,
    E.z, // 4
    F.x,
    F.y,
    F.z, // 5
  ]);

  const indices = [
    // top face
    0, 1, 2, 0, 2, 3,
    // left face
    4, 0, 3,
    // right face
    5, 2, 1,
    // sloped face
    5, 1, 0, 4, 5, 0,
    // back face
    3, 2, 5, 3, 5, 4,
  ];

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
};
