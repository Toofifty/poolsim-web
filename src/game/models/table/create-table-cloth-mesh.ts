import { CylinderGeometry, Mesh, SphereGeometry } from 'three';
import type { Pocket } from '../../objects/pocket';
import { properties } from '../../physics/properties';
import { createMaterial } from '../../rendering/create-material';
import { createRoundedRect, subtract } from '../util';

export const createTableClothMesh = (pockets: Pocket[]) => {
  const height = properties.ballRadius;
  let geometry = createRoundedRect(
    properties.tableLength + properties.pocketCornerRadius * 2,
    properties.tableWidth + properties.pocketCornerRadius * 2,
    properties.pocketCornerRadius,
    { depth: height, bevelEnabled: false }
  ).translate(0, 0, -height * 2);

  pockets.forEach((pocket) => {
    const cylinder = new CylinderGeometry(
      pocket.radius * 1.01,
      pocket.radius * 1.01,
      height * 3
    );
    cylinder.rotateX(Math.PI / 2);
    cylinder.translate(pocket.position.x, pocket.position.y, -height / 2);
    geometry = subtract(geometry, cylinder);
    // slight bevel around pockets
    const sr = pocket.radius * 2;
    const sphere = new SphereGeometry(sr);
    const z = Math.sqrt(sr * sr - pocket.radius * pocket.radius);
    sphere.translate(
      pocket.position.x,
      pocket.position.y,
      z - height - properties.pocketBevel
    );
    geometry = subtract(geometry, sphere);
  });

  const cloth = new Mesh(
    geometry,
    createMaterial({
      color: properties.colorTableCloth,
      roughness: 1,
      metalness: 0,
      sheen: 1,
      sheenRoughness: 1,
      sheenColor: 0xffffff,
    })
  );
  cloth.castShadow = true;
  cloth.receiveShadow = true;
  return cloth;
};
