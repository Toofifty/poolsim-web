import type { Vector3 } from 'three';
import { constrain } from '../math';

export class Polygon {
  public vertices: Vector3[];

  constructor(vertices: Vector3[]) {
    this.vertices = vertices;
  }

  public getFlatVertices() {
    return this.vertices.flatMap((vertex) => [vertex.x, vertex.y, vertex.z]);
  }

  public findClosestPoint(point: Vector3) {
    let closest = this.vertices[0];
    let minDistSq = point.clone().sub(closest).lengthSq();

    for (let i = 0; i < this.vertices.length; i++) {
      const start = this.vertices[i];
      const end = this.vertices[(i + 1) % this.vertices.length];

      const closestOnEdge = this.findClosestPointOnLine(point, start, end);
      const distSq = point.clone().sub(closestOnEdge).lengthSq();

      if (distSq < minDistSq) {
        minDistSq = distSq;
        closest = closestOnEdge;
      }
    }

    return closest;
  }

  private findClosestPointOnLine(point: Vector3, start: Vector3, end: Vector3) {
    const line = end.clone().sub(start);
    const toPoint = point.clone().sub(start);

    if (line.length() === 0) {
      return start.clone();
    }

    const t = constrain(toPoint.dot(line) / line.lengthSq(), 0, 1);
    return start.clone().add(line.clone().multiplyScalar(t));
  }
}
