import { PointLight } from 'three';
import type { Params } from '../../../../common/simulation/physics';

const createPointLight = (x: number, y: number) => {
  const light = new PointLight(0xffffff, 0.01);
  light.position.set(x, y, 0);
  //   light.castShadow = true;
  return light;
};

export const createNeonLightStrips = (params: Params) => {
  const {
    table: { width, length, railPadding },
  } = params;

  const gapX = length / 16;
  const gapY = width / 8;

  const midY = (width * 0.95) / 2;
  const midX = (length * 0.95) / 2;

  const lights: PointLight[] = [];

  // top & bottom
  for (let x = gapX; x < length; x += gapX) {
    if (x === length / 2) continue;

    lights.push(createPointLight(x - length / 2, midY));
    lights.push(createPointLight(x - length / 2, -midY));
  }

  // left & right
  for (let y = gapY; y < width; y += gapY) {
    lights.push(createPointLight(midX, y - width / 2));
    lights.push(createPointLight(-midX, y - width / 2));
  }

  return lights;
};
