import type { Vec } from '@common/math';
import type { Params } from '@common/simulation/physics';
import { ExtrudeGeometry, Path } from 'three';
import { createRoundedRectShape, fixUVs } from '../util';

export const createTableClothGeometry = (
  params: Params,
  pockets: { position: Vec; radius: number }[]
) => {
  const { table, pocket } = params;

  const shape = createRoundedRectShape(
    table.length + pocket.corner.radius * 2,
    table.width + pocket.corner.radius * 2,
    pocket.corner.radius
  );

  for (const pocket of pockets) {
    const path = new Path();
    path.absellipse(
      pocket.position[0],
      pocket.position[1],
      pocket.radius,
      pocket.radius,
      0,
      Math.PI * 2,
      false
    );
    shape.holes.push(path);
  }

  let translateZ = -params.ball.radius;
  const geometry = new ExtrudeGeometry(shape, {
    depth: params.ball.radius,
    bevelSize: 0.0025,
    bevelThickness: 0.0025,
  }).translate(0, 0, translateZ - params.ball.radius - 0.0025);

  fixUVs(geometry);

  return geometry;
};
