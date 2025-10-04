import { Color, type Vector3 } from 'three';
import {
  Line2,
  LineGeometry,
  LineMaterial,
} from 'three/examples/jsm/Addons.js';
import { BallState } from '../../../../common/simulation/physics/ball';
import { settings } from '../../store/settings';

export const getColor = (state: BallState) => {
  switch (state) {
    case BallState.Airborne:
      // orange
      return new Color(0xff8800);
    case BallState.Sliding:
      // yellow
      return new Color(0xffff00);
    case BallState.Rolling:
      // green
      return new Color(0x00ff00);
    case BallState.Spinning:
      // blue
      return new Color(0x0000ff);
    case BallState.Stationary:
      // white
      return new Color(0xffffff);
    case BallState.Pocketed:
      // red
      return new Color(0xff0000);
    default:
      return new Color(0x000000);
  }
};

const material = new LineMaterial({
  linewidth: 4,
  vertexColors: true,
  dashed: true,
  dashScale: 50,
});

export type TrackingPoint = { position: Vector3; state: BallState };

export const createPathMesh = (points: TrackingPoint[], ballColor: Color) => {
  const { physicsGuidelines } = settings;

  const positions: number[] = [];
  const colors: number[] = [];

  for (let i = 0; i < points.length; i++) {
    const { position, state } = points[i];
    positions.push(position.x, position.y, position.z);
    const color = physicsGuidelines ? getColor(state) : ballColor;
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
