import type { Params } from '../../../common/simulation/physics';
import { Pocket } from '../objects/pocket';

export const createPockets = (params: Params) => {
  const {
    table,
    pocket: { edge, corner },
    ball,
  } = params;

  const left = -table.length / 2;
  const right = table.length / 2;
  const top = -table.width / 2;
  const bottom = table.width / 2;

  const edgeOffset = corner.radius - edge.radius;

  return [
    new Pocket(params, 0, left, top, -ball.radius, corner.radius),
    new Pocket(params, 1, right, top, -ball.radius, corner.radius),
    new Pocket(params, 2, left, bottom, -ball.radius, corner.radius),
    new Pocket(params, 3, right, bottom, -ball.radius, corner.radius),
    new Pocket(params, 4, 0, top - edgeOffset, -ball.radius, edge.radius),
    new Pocket(params, 5, 0, bottom + edgeOffset, -ball.radius, edge.radius),
  ];
};
