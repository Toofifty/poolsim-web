import { Vector3 } from 'three';
import { Polygon } from './polygon';

export class PhysicsCushion extends Polygon {
  static fromRelativeVertices(...verticesXY: number[]) {
    let x = 0;
    let y = 0;

    const vertices: Vector3[] = [];
    for (let i = 0; i < verticesXY.length; i += 2) {
      vertices[i / 2] = new Vector3(x + verticesXY[i], y + verticesXY[i + 1]);
      x += verticesXY[i];
      y += verticesXY[i + 1];
    }

    return new PhysicsCushion(vertices);
  }
}
