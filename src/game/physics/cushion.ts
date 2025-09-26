import { vec, type Vec } from './math';
import { Polygon } from './polygon';

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

  /**
   * Vertices _must_ be in this order (regardless of orientation):
   *
   *  tl - - - - - - - - - - tr
   *    \                  /      tl -> bl -> br -> tr
   *     bl ->-------->- br
   */
  static fromVertices(...vertices: [tl: Vec, bl: Vec, br: Vec, tr: Vec]) {
    return new PhysicsCushion(vertices);
  }
}
