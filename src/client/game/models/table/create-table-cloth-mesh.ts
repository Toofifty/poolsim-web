import { ExtrudeGeometry, Mesh, Path } from 'three';
import type { Params } from '../../../../common/simulation/physics';
import type { Pocket } from '../../objects/pocket';
import { createMaterial } from '../../rendering/create-material';
import { GraphicsDetail, settings } from '../../store/settings';
import type { ThemeObject } from '../../store/theme';
import { subscribeTo } from '../../util/subscribe';
import { createRoundedRectShape, fixUVs } from '../util';
import {
  createTableClothNormalTexture,
  createTableClothTexture,
} from './create-table-cloth-texture';

export const createTableClothMesh = (
  params: Params,
  pockets: Pocket[],
  theme: ThemeObject
) => {
  const { table, pocket } = params;

  const shape = createRoundedRectShape(
    table.length + pocket.corner.radius * 2,
    table.width + pocket.corner.radius * 2,
    pocket.corner.radius
  );

  for (const pocket of pockets) {
    const path = new Path();
    path.absellipse(
      pocket.physics.position[0],
      pocket.physics.position[1],
      pocket.radius,
      pocket.radius,
      0,
      Math.PI * 2,
      false
    );
    shape.holes.push(path);
  }

  let translateZ = -params.ball.radius;
  const geometry = new ExtrudeGeometry(shape, {
    depth: params.ball.radius,
    bevelSize: 0.0025,
    bevelThickness: 0.0025,
  }).translate(0, 0, translateZ - params.ball.radius - 0.0025);

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
