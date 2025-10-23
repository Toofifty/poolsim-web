import { ECSComponent } from '@common/ecs';
import { vec, type Vec } from '@common/math';
import { defaultParams, type Params } from '@common/simulation/physics';
import { constrain } from '@common/util';

export class Collider extends ECSComponent {
  public collisionBox: readonly [bl: Vec, tr: Vec];
  public segments: readonly [Vec, Vec][];

  constructor(
    public vertices: Vec[],
    public restitution: number,
    public friction: number
  ) {
    super();
    this.collisionBox = Collider.computeCollisionBox(defaultParams, vertices);

    this.segments = Collider.computeSegments(vertices);
  }

  public static computeCollisionBox(
    { ball: { radius } }: Params,
    vertices: Vec[]
  ) {
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

    const pad = radius * 2;

    return [
      vec.new(minX - pad, minY - pad),
      vec.new(maxX - minX + pad * 2, maxY - minY + pad * 2),
    ] as const;
  }

  public static computeSegments(vertices: Vec[]) {
    const segments: [Vec, Vec][] = [];
    const offsetZ = defaultParams.ball.radius;

    for (let i = 0; i < vertices.length; i++) {
      segments.push([
        vec.setZ(vertices[i], offsetZ),
        vec.setZ(vertices[(i + 1) % vertices.length], offsetZ),
      ]);
    }

    return segments;
  }

  public static inBounds(cushion: Collider, point: Vec) {
    const [position, size] = cushion.collisionBox;
    return (
      point[0] >= position[0] &&
      point[0] <= position[0] + size[0] &&
      point[1] >= position[1] &&
      point[1] <= position[1] + size[1]
    );
  }

  public static findClosestPoint(cushion: Collider, point: Vec) {
    let closest = cushion.vertices[0];
    let minDistSq = vec.lenSq(vec.sub(point, closest));

    for (let [start, end] of cushion.segments) {
      const closestOnEdge = Collider.findClosestPointOnLine(point, start, end);
      const distSq = vec.lenSq(vec.sub(point, closestOnEdge));

      if (distSq < minDistSq) {
        minDistSq = distSq;
        closest = closestOnEdge;
      }
    }

    return closest;
  }

  private static findClosestPointOnLine(point: Vec, start: Vec, end: Vec) {
    const line = vec.sub(end, start);
    const toPoint = vec.sub(point, start);

    if (vec.isZero(line)) {
      return start;
    }

    const t = constrain(vec.dot(toPoint, line) / vec.lenSq(line), 0, 1);
    return vec.add(start, vec.mult(line, t));
  }
}
