import {
  Line2,
  LineGeometry,
  LineMaterial,
} from 'three/examples/jsm/Addons.js';
import { OverlayRenderable } from '../../components/overlay-renderable';

const material = new LineMaterial({
  linewidth: 4,
  vertexColors: true,
});

export class GuidelineMesh extends OverlayRenderable {
  constructor(public line: Line2, public geometry: LineGeometry) {
    super(line, true);
  }

  public static create() {
    const geometry = new LineGeometry();
    const line = new Line2(geometry, material);
    // line.computeLineDistances();
    line.scale.set(1, 1, 1);

    return new GuidelineMesh(line, geometry);
  }
}
