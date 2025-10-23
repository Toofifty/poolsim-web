import { type Vec } from '@common/math';
import { Color, Mesh } from 'three';
import { Line } from '../models/line';
import { OverlayRenderable } from './overlay-renderable';

export class LineMesh extends OverlayRenderable {
  constructor(public mesh: Mesh) {
    super(mesh, { outline: true });
  }

  public static create() {
    return new LineMesh(Line.createMesh());
  }

  public static update({ mesh }: LineMesh, points: Vec[], colors?: Color[]) {
    Line.update(mesh, points, colors);
  }
}
