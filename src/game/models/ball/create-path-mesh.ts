import { Color, type Vector3 } from 'three';
import { BallState } from '../../physics/ball';
import {
  Line2,
  LineGeometry,
  LineMaterial,
} from 'three/examples/jsm/Addons.js';

export const getColor = (state: BallState) => {
  switch (state) {
    case BallState.Airborne:
      return new Color(0x00ffff);
    case BallState.Sliding:
      return new Color(0xff0000);
    case BallState.Rolling:
      return new Color(0x00ff00);
    case BallState.Spinning:
      return new Color(0x0000ff);
    case BallState.Stationary:
      return new Color(0xffffff);
    case BallState.Pocketed:
      return new Color(0xff00ff);
    default:
      return new Color(0x000000);
  }
};

const material = new LineMaterial({
  linewidth: 4,
  vertexColors: true,
  dashed: false,
});

export type TrackingPoint = { position: Vector3; state: BallState };

export const createPathMesh = (points: TrackingPoint[]) => {
  const positions: number[] = [];
  const colors: number[] = [];

  for (let i = 0; i < points.length; i++) {
    const { position, state } = points[i];
    positions.push(position.x, position.y, position.z);
    const color = getColor(state);
    colors.push(color.r, color.g, color.b);
  }

  const geometry = new LineGeometry();
  geometry.setPositions(positions);
  geometry.setColors(colors);

  const line = new Line2(geometry, material);
  line.computeLineDistances();
  line.scale.set(1, 1, 1);

  return line;
};
