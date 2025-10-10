import { Component } from '@common/ecs';
import { vec, type Vec } from '@common/math';
import { defaultParams, type Params } from '@common/simulation/physics';
import { constrain } from '@common/util';

export class Cushion extends Component {
  public collisionBox: readonly [Vec, Vec];
  /**
   * Segments used for physics calculations.
   * Specifically only includes segments facing the table
   */
  public segments: readonly [[Vec, Vec], [Vec, Vec], [Vec, Vec]];

  constructor(public vertices: [Vec, Vec, Vec, Vec]) {
    super();

    this.collisionBox = computeCollisionBox(defaultParams, vertices);
    const [tl, bl, br, tr] = vertices;
    const offsetZ = 0; // params.cushion.height - params.ball.radius;
    this.segments = [
      [vec.setZ(tl, offsetZ), vec.setZ(bl, offsetZ)],
      [vec.setZ(bl, offsetZ), vec.setZ(br, offsetZ)],
      [vec.setZ(br, offsetZ), vec.setZ(tr, offsetZ)],
    ];
  }

  public inBounds(point: Vec) {
    const [position, size] = this.collisionBox;
    return (
      point[0] >= position[0] &&
      point[0] <= position[0] + size[0] &&
      point[1] >= position[1] &&
      point[1] <= position[1] + size[1]
    );
  }

  public findClosestPoint(point: Vec) {
    let closest = this.vertices[0];
    let minDistSq = vec.lenSq(vec.sub(point, closest));

    for (let [start, end] of this.segments) {
      const closestOnEdge = this.findClosestPointOnLine(point, start, end);
      const distSq = vec.lenSq(vec.sub(point, closestOnEdge));

      if (distSq < minDistSq) {
        minDistSq = distSq;
        closest = closestOnEdge;
      }
    }

    return closest;
  }

  private findClosestPointOnLine(point: Vec, start: Vec, end: Vec) {
    const line = vec.sub(end, start);
    const toPoint = vec.sub(point, start);

    if (vec.isZero(line)) {
      return start;
    }

    const t = constrain(vec.dot(toPoint, line) / vec.lenSq(line), 0, 1);
    return vec.add(start, vec.mult(line, t));
  }

  /**
   * Vertices _must_ be in this order (regardless of orientation):
   *
   *  tl - - - - - - - - - - tr
   *    \                  /      tl -> bl -> br -> tr
   *     bl ->-------->- br
   */
  public static create(vertices: [Vec, Vec, Vec, Vec]) {
    return new Cushion(vertices);
  }
}

export const computeCollisionBox = (
  { ball: { radius } }: Params,
  vertices: Vec[]
) => {
  let minX = 0;
  let minY = 0;
  let maxX = 0;
  let maxY = 0;
  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    if (minX === 0 || v[0] < minX) minX = v[0];
    if (maxX === 0 || v[0] > maxX) maxX = v[0];
    if (minY === 0 || v[1] < minY) minY = v[1];
    if (maxY === 0 || v[1] > maxY) maxY = v[1];
  }

  return [
    vec.new(minX - radius, minY - radius),
    vec.new(maxX - minX + radius * 2, maxY - minY + radius * 2),
  ] as const;
};
