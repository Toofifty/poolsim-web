import { vec, type Vec } from '@common/math';
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Mesh,
  MeshPhysicalMaterial,
  type MeshPhysicalMaterialParameters,
} from 'three';
import { Game } from '../game';
import { createMaterial } from '../rendering/create-material';
import { toVec } from '../util/three-interop';

const MAX_POINTS = 2048;
const THICKNESS = 0.005;

export class Line {
  public static createMaterial({
    color = 0xffffff,
  }: Pick<MeshPhysicalMaterialParameters, 'color'> = {}) {
    return createMaterial({
      side: DoubleSide,
      vertexColors: true,
      color,
    });
  }

  public static createMesh({
    color,
  }: Pick<MeshPhysicalMaterialParameters, 'color'> = {}) {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(MAX_POINTS * 2 * 3), 3)
    );
    geometry.setAttribute(
      'color',
      new BufferAttribute(new Float32Array(MAX_POINTS * 2 * 3), 3)
    );

    const indices = [];
    for (let i = 0; i < MAX_POINTS - 1; i++) {
      const a = i * 2,
        b = a + 1,
        c = a + 2,
        d = a + 3;
      indices.push(a, b, c, b, d, c);
    }
    geometry.setIndex(indices);

    return new Mesh(geometry, Line.createMaterial({ color }));
  }

  public static update(mesh: Mesh, points: Vec[], colors?: Color[]) {
    const position = mesh.geometry.attributes.position.array;
    const color = mesh.geometry.attributes.color.array;
    const n = Math.min(MAX_POINTS, points.length);
    const camera = toVec(Game.instance.camera.position);
    const defaultColor = (mesh.material as MeshPhysicalMaterial).color;

    for (let i = 0; i < n; i++) {
      const point = points[i];
      const next = points[i + 1] || point;

      const dir = vec.norm(vec.sub(next, point));
      const view = vec.norm(vec.sub(camera, point));
      const perp = vec.mult(vec.norm(vec.cross(dir, view)), THICKNESS * 0.5);

      const i2 = i * 6;
      position[i2 + 0] = point[0] - perp[0];
      position[i2 + 1] = point[1] - perp[1];
      position[i2 + 2] = point[2] - perp[2];
      position[i2 + 3] = point[0] + perp[0];
      position[i2 + 4] = point[1] + perp[1];
      position[i2 + 5] = point[2] + perp[2];

      const col = colors?.[i] ?? defaultColor;
      color[i2 + 0] = col.r;
      color[i2 + 1] = col.g;
      color[i2 + 2] = col.b;
      color[i2 + 3] = col.r;
      color[i2 + 4] = col.g;
      color[i2 + 5] = col.b;
    }

    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.attributes.color.needsUpdate = true;
    mesh.geometry.setDrawRange(0, (n - 1) * 6);
  }
}
