import { Mesh, PlaneGeometry } from 'three';
import { properties } from '../../physics/properties';
import { combine } from '../util';
import { createMaterial } from '../../rendering/create-material';

const createDiamond = (x: number, y: number) => {
  const diamond = new PlaneGeometry(
    properties.diamondWidth,
    properties.diamondWidth
  );
  diamond.rotateZ(Math.PI / 4);
  diamond.translate(x, y, 0.001);
  return diamond;
};

export const createTableRailDiamondsMesh = () => {
  const { tableWidth: tw, tableLength: tl, railPadding } = properties;

  const gapX = tl / 8;
  const gapY = tw / 4;

  const midY = tw / 2 + (properties.pocketCornerRadius + railPadding) / 2;
  const midX = tl / 2 + (properties.pocketCornerRadius + railPadding) / 2;

  const diamonds: PlaneGeometry[] = [];

  // top & bottom
  for (let x = gapX; x < tl; x += gapX) {
    if (x === tl / 2) continue;

    diamonds.push(createDiamond(x - tl / 2, midY));
    diamonds.push(createDiamond(x - tl / 2, -midY));
  }

  // left & right
  for (let y = gapY; y < tw; y += gapY) {
    diamonds.push(createDiamond(midX, y - tw / 2));
    diamonds.push(createDiamond(-midX, y - tw / 2));
  }

  return new Mesh(
    combine(...diamonds),
    createMaterial({
      color: properties.colorTableRailDiamond,
      roughness: 0,
      metalness: 0.6,
    })
  );
};
