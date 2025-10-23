import { vec } from '@common/math';
import { defaultParams } from '@common/simulation/physics';
import {
  Mesh,
  Object3D,
  SphereGeometry,
  type MeshPhysicalMaterialParameters,
} from 'three';
import { OverlayRenderable } from '../../components/overlay-renderable';
import { createBallTexture } from '../../models/ball/create-ball-texture';
import { Line } from '../../models/line';
import { createMaterial } from '../../rendering/create-material';
import { GraphicsDetail, settings } from '../../store/settings';
import { makeTheme } from '../../store/theme';

export class Projection extends OverlayRenderable {
  constructor(
    public root: Object3D,
    public line: Mesh,
    public ball: Mesh,
    public lastEndPoint = vec.new()
  ) {
    super(root.add(line, ball), { outline: true });
    root.visible = false;
  }

  public static create({
    id,
    radius,
    color,
  }: {
    id: number;
    radius: number;
    color: MeshPhysicalMaterialParameters['color'];
  }) {
    const root = new Object3D();

    const segments = settings.detail === GraphicsDetail.Low ? 8 : 16;
    const geometry = new SphereGeometry(radius, segments, segments / 2);
    const material = createMaterial({
      map: createBallTexture(makeTheme(), id),
      roughness: 0.1,
      metalness: 0,
      transparent: true,
      opacity: defaultParams.ball.projectionOpacity,
    });
    const ball = new Mesh(geometry, material);
    const line = Line.createMesh({ color });

    return new Projection(root, line, ball);
  }
}
