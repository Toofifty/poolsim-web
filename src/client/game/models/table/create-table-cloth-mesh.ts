import type { Vec } from '@common/math';
import { Mesh } from 'three';
import type { Params } from '../../../../common/simulation/physics';
import { createMaterial } from '../../rendering/create-material';
import { GraphicsDetail, settings } from '../../store/settings';
import type { ThemeObject } from '../../store/theme';
import { subscribeTo } from '../../util/subscribe';
import { fixUVs } from '../util';
import { createTableClothGeometry } from './create-table-cloth-geometry';
import {
  createTableClothNormalTexture,
  createTableClothTexture,
} from './create-table-cloth-texture';

export const createTableClothMesh = (
  params: Params,
  pockets: { position: Vec; radius: number }[],
  theme: ThemeObject
) => {
  let translateZ = -params.ball.radius;
  const geometry = createTableClothGeometry(params, pockets);

  // todo: not depend on ball radius (table cloth at 0z)
  subscribeTo(params, ['ball.radius'], () => {
    geometry.translate(0, 0, -translateZ);
    translateZ = -params.ball.radius;
    geometry.translate(0, 0, translateZ);
  });

  fixUVs(geometry);

  const cloth = new Mesh(
    geometry,
    createMaterial({
      map: createTableClothTexture(params, theme),
      normalMap:
        settings.detail === GraphicsDetail.High
          ? createTableClothNormalTexture(params)
          : null,
      roughness: 1,
      metalness: 0,
      sheen: 1,
      sheenRoughness: 1,
      sheenColor: 0xffffff,
    })
  );
  cloth.receiveShadow = true;
  return cloth;
};
