import { vec, type Vec } from '@common/math';
import { defaultParams } from '@common/simulation/physics';
import { Pocket } from '../../plugins/table/pocket.component';

export const createPocketFixtures = () => {
  const {
    table,
    pocket: { edge, corner },
  } = defaultParams;

  const left = -table.length / 2;
  const right = table.length / 2;
  const top = -table.width / 2;
  const bottom = table.width / 2;

  const edgeOffset = corner.radius - edge.radius;

  const pockets: { id: number; position: Vec; radius: number }[] = [
    { id: 0, position: vec.new(left, top), radius: corner.radius },
    { id: 1, position: vec.new(right, top), radius: corner.radius },
    { id: 2, position: vec.new(left, bottom), radius: corner.radius },
    { id: 3, position: vec.new(right, bottom), radius: corner.radius },
    { id: 4, position: vec.new(0, top - edgeOffset), radius: edge.radius },
    { id: 5, position: vec.new(0, bottom + edgeOffset), radius: edge.radius },
  ];

  return pockets.map((p) => Pocket.create(p));
};
