import { CylinderGeometry, Mesh } from 'three';
import type { Pocket } from '../../objects/pocket';
import { properties } from '../../physics/properties';
import { createMaterial } from '../../rendering/create-material';
import { createRoundedRect, subtract } from '../util';

export const createTableRailMesh = (pockets: Pocket[]) => {
  const height = properties.ballRadius * 2;

  const railBase = createRoundedRect(
    properties.tableLength +
      properties.pocketCornerRadius * 2 +
      properties.railPadding,
    properties.tableWidth +
      properties.pocketCornerRadius * 2 +
      properties.railPadding,
    properties.pocketCornerRadius + properties.railPadding,
    { depth: height - 0.01, bevelThickness: 0.01, bevelSize: 0.01 }
  ).translate(0, 0, -height);

  const tableInner = createRoundedRect(
    properties.tableLength,
    properties.tableWidth,
    0,
    { depth: height * 2, bevelEnabled: false }
  ).translate(0, 0, -height);

  let rail = subtract(railBase, tableInner);

  pockets.forEach((pocket) => {
    const cylinder = new CylinderGeometry(
      pocket.radius,
      pocket.radius,
      height * 2
    );
    cylinder.rotateX(Math.PI / 2);
    cylinder.translate(pocket.position.x, pocket.position.y, -height / 2);
    rail = subtract(rail, cylinder);
  });

  rail.computeVertexNormals();

  const mesh = new Mesh(
    rail,
    createMaterial({
      color: properties.colorTableRail,
      roughness: 0.2,
      metalness: 0.1,
    })
  );
  mesh.receiveShadow = true;
  return mesh;
};
