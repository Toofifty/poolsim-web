import { Polygon } from './polygon';
import { vec, type Vec } from './vec';

export class PhysicsCushion extends Polygon {
  static fromRelativeVertices(...verticesXY: number[]) {
    let x = 0;
    let y = 0;

    const vertices: Vec[] = [];
    for (let i = 0; i < verticesXY.length; i += 2) {
      vertices[i / 2] = vec.new(x + verticesXY[i], y + verticesXY[i + 1]);
      x += verticesXY[i];
      y += verticesXY[i + 1];
    }

    return new PhysicsCushion(vertices);
  }
}
