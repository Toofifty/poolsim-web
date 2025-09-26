import { CylinderGeometry, Mesh } from 'three';
import { params } from '../../../../common/simulation/physics/params';
import { properties } from '../../../../common/simulation/physics/properties';
import type { Pocket } from '../../objects/pocket';
import { createMaterial } from '../../rendering/create-material';
import type { ThemeObject } from '../../store/theme';
import { createRoundedRect, subtract } from '../util';

export const createTableRailMesh = (pockets: Pocket[], theme: ThemeObject) => {
  const { ball, cushion, pocket } = params;

  const height = cushion.height * 2;

  const railBase = createRoundedRect(
    properties.tableLength + pocket.corner.radius * 2 + properties.railPadding,
    properties.tableWidth + pocket.corner.radius * 2 + properties.railPadding,
    pocket.corner.radius + properties.railPadding,
    { depth: height - 0.01, bevelThickness: 0.01, bevelSize: 0.01 }
  ).translate(0, 0, -ball.radius * 2);

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
    cylinder.translate(pocket.position[0], pocket.position[1], -height / 2);
    rail = subtract(rail, cylinder);
  });

  rail.computeVertexNormals();

  const mesh = new Mesh(
    rail,
    createMaterial({
      color: theme.table.colorRail,
      roughness: 0.2,
      metalness: 0.4,
    })
  );
  mesh.receiveShadow = true;
  return mesh;
};
