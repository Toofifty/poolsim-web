import {
  CylinderGeometry,
  ExtrudeGeometry,
  Mesh,
  Path,
  SphereGeometry,
} from 'three';
import type { Pocket } from '../../objects/pocket';
import { properties } from '../../physics/properties';
import { createMaterial } from '../../rendering/create-material';
import {
  createRoundedRect,
  createRoundedRectShape,
  fixUVs,
  generateBoundingBoxUVs,
  subtract,
} from '../util';
import {
  createTableClothNormalTexture,
  createTableClothTexture,
} from './create-table-cloth-texture';
import type { ThemeObject } from '../../store/theme';
import { params } from '../../physics/params';
import { settings } from '../../store/settings';

// todo: use Shape & ExtrudeGeometry to round pocket edges
export const createTableClothMesh = (pockets: Pocket[], theme: ThemeObject) => {
  const shape = createRoundedRectShape(
    properties.tableLength + properties.pocketCornerRadius * 2,
    properties.tableWidth + properties.pocketCornerRadius * 2,
    properties.pocketCornerRadius
  );

  for (const pocket of pockets) {
    const path = new Path();
    path.absellipse(
      pocket.position.x,
      pocket.position.y,
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
