import type { Vec } from '@common/math';
import type { Params } from '@common/simulation/physics';
import { CylinderGeometry } from 'three';
import { createRoundedRect, subtract } from '../util';

export const createTableRailGeometry = (
  params: Params,
  pockets: { position: Vec; radius: number }[]
) => {
  const { ball, cushion, pocket, table } = params;

  const height = cushion.height * 2;

  const railBase = createRoundedRect(
    table.length + pocket.corner.radius * 2 + table.railPadding,
    table.width + pocket.corner.radius * 2 + table.railPadding,
    pocket.corner.radius + table.railPadding,
    { depth: height - 0.01, bevelThickness: 0.01, bevelSize: 0.01 }
  ).translate(0, 0, -ball.radius * 2);

  const tableInner = createRoundedRect(table.length, table.width, 0, {
    depth: height * 2,
    bevelEnabled: false,
  }).translate(0, 0, -height);

  let geometry = subtract(railBase, tableInner);

  pockets.forEach((pocket) => {
    const cylinder = new CylinderGeometry(
      pocket.radius,
      pocket.radius,
      height * 2
    );
    cylinder.rotateX(Math.PI / 2);
    cylinder.translate(pocket.position[0], pocket.position[1], -height / 2);
    geometry = subtract(geometry, cylinder);
  });

  geometry.computeVertexNormals();

  return geometry;
};
