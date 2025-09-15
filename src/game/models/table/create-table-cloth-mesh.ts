import { Mesh, Shape, ShapeGeometry } from 'three';
import type { Pocket } from '../../objects/pocket';
import { properties } from '../../physics/properties';
import { createMaterial } from '../../rendering/create-material';

export const createTableClothMesh = (pockets: Pocket[]) => {
  const l = properties.tableLength + properties.pocketCornerRadius * 2;
  const w = properties.tableWidth + properties.pocketCornerRadius * 2;
  const shape = new Shape();
  shape.moveTo(-l / 2, -w / 2);
  shape.lineTo(l / 2, -w / 2);
  shape.lineTo(l / 2, w / 2);
  shape.lineTo(-l / 2, w / 2);
  shape.lineTo(-l / 2, -w / 2);
  pockets.forEach((pocket) => {
    const hole = new Shape();
    hole.absarc(
      pocket.position.x,
      pocket.position.y,
      pocket.radius,
      0,
      Math.PI * 2,
      false
    );
    shape.holes.push(hole);
  });

  const cloth = new Mesh(
    new ShapeGeometry(shape),
    createMaterial({
      color: '#227722',
      roughness: 1,
      metalness: 0,
      sheen: 1,
      sheenRoughness: 1,
      sheenColor: 0xffffff,
    })
  );
  cloth.castShadow = true;
  cloth.receiveShadow = true;
  cloth.position.z = -properties.ballRadius;
  return cloth;
};
