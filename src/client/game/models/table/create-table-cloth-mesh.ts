import type { Vec } from '@common/math';
import { Mesh } from 'three';
import type { Params } from '../../../../common/simulation/physics';
import { createMaterial } from '../../rendering/create-material';
import { GraphicsDetail, settings } from '../../store/settings';
import type { ThemeObject } from '../../store/theme';
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
  const geometry = createTableClothGeometry(params, pockets);

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
