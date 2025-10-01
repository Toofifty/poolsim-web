import { vec, type Vec } from '../../math';
import { constrain } from '../../util';
import type { StaticParams } from './default-params';

export class Polygon {
  public vertices: [Vec, Vec, Vec, Vec];
  public collisionBox: [Vec, Vec];

  constructor(private params: StaticParams, vertices: Vec[]) {
    this.vertices = vertices as [Vec, Vec, Vec, Vec];

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
    const {
      ball: { radius },
    } = params;
    this.collisionBox = [
      vec.new(minX - radius, minY - radius),
      vec.new(maxX - minX + radius * 2, maxY - minY + radius * 2),
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

    for (let i = 0; i < this.vertices.length; i++) {
      const start = this.vertices[i];
      const end = this.vertices[(i + 1) % this.vertices.length];

      const closestOnEdge = this.findClosestPointOnLine(point, start, end);
      const distSq = vec.lenSq(vec.sub(point, closestOnEdge));

      if (distSq < minDistSq) {
        minDistSq = distSq;
        closest = closestOnEdge;
      }
    }

    return vec.setZ(
      closest,
      this.params.cushion.height - this.params.ball.radius
    );
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
}
