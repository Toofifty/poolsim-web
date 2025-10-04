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
import { GraphicsDetail, settings } from '../../store/settings';
import { themed, type ThemeObject } from '../../store/theme';
import { subscribeTo } from '../../util/subscribe';

const normalMap = new TextureLoader().load(normalMapUrl);

export const createBallMesh = (
  params: Params,
  theme: ThemeObject,
  {
    color,
    number,
  }: {
    color: Color;
    number: number;
  }
) => {
  // 32 is sphere geo default
  const segments = settings.detail === GraphicsDetail.Low ? 16 : 32;
  const geometry = new SphereGeometry(
    params.ball.radius,
    segments,
    segments / 2
  );
  const texture = createBallTexture(theme, number);
  const material = createMaterial({
    map: texture,
    roughness: theme.balls.roughness,
    metalness: theme.balls.metalness,
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

  themed(
    (theme) => {
      mesh.material.dispose();
      mesh.material = createMaterial({
        map: createBallTexture(theme, number),
        roughness: theme.balls.roughness,
        metalness: theme.balls.metalness,
        normalMap,
        normalScale: new Vector2(0.5, 0.5),
      });
      mesh.material.needsUpdate = true;
    },
    { init: false }
  );

  subscribeTo(params, ['ball.radius'], () => {
    mesh.geometry.dispose();
    mesh.geometry = new SphereGeometry(params.ball.radius);
  });

  subscribeTo(params, ['ball.projectionOpacity'], () => {
    projectionMaterial.opacity = params.ball.projectionOpacity;
  });

  return { mesh, projectionMaterial };
};
