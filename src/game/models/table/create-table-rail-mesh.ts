import {
  BoxGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Mesh,
  Shape,
} from 'three';
import type { Pocket } from '../../objects/pocket';
import { properties } from '../../physics/properties';
import { createMaterial } from '../../rendering/create-material';
import { subtract } from '../util';

const createRoundedRect = (width: number, height: number, radius: number) => {
  const shape = new Shape();

  const x = -width / 2;
  const y = -height / 2;

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  return shape;
};

export const createTableRailMesh = (pockets: Pocket[]) => {
  const height = properties.ballRadius * 2;

  const railBase = new ExtrudeGeometry(
    createRoundedRect(
      properties.tableLength +
        properties.pocketCornerRadius * 2 +
        properties.railPadding,
      properties.tableWidth +
        properties.pocketCornerRadius * 2 +
        properties.railPadding,
      properties.pocketCornerRadius + properties.railPadding
    ),
    { depth: height - 1, bevelThickness: 1 }
  ).translate(0, 0, -height);

  const tableInner = new ExtrudeGeometry(
    createRoundedRect(properties.tableLength, properties.tableWidth, 0),
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

  return new Mesh(
    rail,
    createMaterial({ color: '#683104', roughness: 0.2, metalness: 0.1 })
  );
};
