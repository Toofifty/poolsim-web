import { PointLight } from 'three';
import { properties } from '../../physics/properties';

const createPointLight = (x: number, y: number) => {
  const light = new PointLight(0xffffff, 0.01);
  light.position.set(x, y, 0);
  //   light.castShadow = true;
  return light;
};

export const createNeonLightStrips = () => {
  const { tableWidth: tw, tableLength: tl, railPadding } = properties;

  const gapX = tl / 16;
  const gapY = tw / 8;

  const midY = (tw * 0.95) / 2;
  const midX = (tl * 0.95) / 2;

  const lights: PointLight[] = [];

  // top & bottom
  for (let x = gapX; x < tl; x += gapX) {
    if (x === tl / 2) continue;

    lights.push(createPointLight(x - tl / 2, midY));
    lights.push(createPointLight(x - tl / 2, -midY));
  }

  // left & right
  for (let y = gapY; y < tw; y += gapY) {
    lights.push(createPointLight(midX, y - tw / 2));
    lights.push(createPointLight(-midX, y - tw / 2));
  }

  return lights;
};
