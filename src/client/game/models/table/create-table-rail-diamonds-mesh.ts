import { Mesh, PlaneGeometry } from 'three';
import { properties } from '../../../../common/simulation/physics/properties';
import { combine } from '../util';
import { createMaterial } from '../../rendering/create-material';
import { params } from '../../../../common/simulation/physics/params';
import type { ThemeObject } from '../../store/theme';

const createDiamond = (x: number, y: number) => {
  const diamond = new PlaneGeometry(
    properties.diamondWidth,
    properties.diamondWidth
  );
  diamond.rotateZ(Math.PI / 4);
  diamond.translate(x, y, 0.001);
  return diamond;
};

export const createTableRailDiamondsMesh = (theme: ThemeObject) => {
  const { ball, cushion } = params;
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

  const mesh = new Mesh(
    combine(...diamonds),
    createMaterial({
      color: theme.table.colorDiamond,
      roughness: 0,
      metalness: 0.6,
    })
  );
  mesh.receiveShadow = true;
  mesh.position.z += cushion.height - ball.radius + 0.005;
  return mesh;
};
