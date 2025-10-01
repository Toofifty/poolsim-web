import { Mesh, PlaneGeometry } from 'three';
import { type Params } from '../../../../common/simulation/physics/params';
import { createMaterial } from '../../rendering/create-material';
import type { ThemeObject } from '../../store/theme';
import { combine } from '../util';

const createDiamond = (params: Params, x: number, y: number) => {
  const diamond = new PlaneGeometry(
    params.table.diamondWidth,
    params.table.diamondWidth
  );
  diamond.rotateZ(Math.PI / 4);
  diamond.translate(x, y, 0.001);
  return diamond;
};

export const createTableRailDiamondsMesh = (
  params: Params,
  theme: ThemeObject
) => {
  const {
    ball,
    cushion,
    pocket,
    table: { width, length, railPadding },
  } = params;

  const gapX = length / 8;
  const gapY = width / 4;

  const midY = width / 2 + (pocket.corner.radius + railPadding) / 2;
  const midX = length / 2 + (pocket.corner.radius + railPadding) / 2;

  const diamonds: PlaneGeometry[] = [];

  // top & bottom
  for (let x = gapX; x < length; x += gapX) {
    if (x === length / 2) continue;

    diamonds.push(createDiamond(params, x - length / 2, midY));
    diamonds.push(createDiamond(params, x - length / 2, -midY));
  }

  // left & right
  for (let y = gapY; y < width; y += gapY) {
    diamonds.push(createDiamond(params, midX, y - width / 2));
    diamonds.push(createDiamond(params, -midX, y - width / 2));
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
