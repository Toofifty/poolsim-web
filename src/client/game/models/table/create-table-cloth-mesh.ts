import { ExtrudeGeometry, Mesh, Path } from 'three';
import { params } from '../../../../common/simulation/physics/params';
import { properties } from '../../../../common/simulation/physics/properties';
import type { Pocket } from '../../objects/pocket';
import { createMaterial } from '../../rendering/create-material';
import { settings } from '../../store/settings';
import type { ThemeObject } from '../../store/theme';
import { createRoundedRectShape, fixUVs } from '../util';
import {
  createTableClothNormalTexture,
  createTableClothTexture,
} from './create-table-cloth-texture';

export const createTableClothMesh = (pockets: Pocket[], theme: ThemeObject) => {
  const shape = createRoundedRectShape(
    properties.tableLength + properties.pocketCornerRadius * 2,
    properties.tableWidth + properties.pocketCornerRadius * 2,
    properties.pocketCornerRadius
  );

  for (const pocket of pockets) {
    const path = new Path();
    path.absellipse(
      pocket.position[0],
      pocket.position[1],
      pocket.radius,
      pocket.radius,
      0,
      Math.PI * 2,
      false
    );
    shape.holes.push(path);
  }

  const geometry = new ExtrudeGeometry(shape, {
    depth: params.ball.radius,
    bevelSize: 0.0025,
    bevelThickness: 0.0025,
  }).translate(0, 0, -params.ball.radius * 2);

  fixUVs(geometry);

  const cloth = new Mesh(
    geometry,
    createMaterial({
      map: createTableClothTexture(theme),
      normalMap: settings.highDetail ? createTableClothNormalTexture() : null,
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
