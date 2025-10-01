import {
  Mesh,
  SphereGeometry,
  TextureLoader,
  Vector2,
  type Color,
} from 'three';
import { createMaterial } from '../../rendering/create-material';
import { createBallTexture } from './create-ball-texture';

import type { Params } from '../../../../common/simulation/physics';
import normalMapUrl from '../../../assets/scratch_normal.png';
import type { ThemeObject } from '../../store/theme';

const normalMap = new TextureLoader().load(normalMapUrl);

export const createBallMesh = (
  params: Params,
  theme: ThemeObject,
  {
    radius,
    color,
    number,
  }: {
    radius: number;
    color: Color;
    number: number;
  }
) => {
  const geometry = new SphereGeometry(radius);
  const texture = createBallTexture(theme, {
    color,
    number,
  });
  const material = createMaterial({
    map: texture,
    roughness: 0.1,
    metalness: 0,
    normalMap,
    normalScale: new Vector2(0.5, 0.5),
  });
  const projectionMaterial = createMaterial({
    map: texture,
    roughness: 0.1,
    metalness: 0,
    transparent: true,
    opacity: params.ball.projectionOpacity,
  });

  const mesh = new Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return { mesh, projectionMaterial };
};
