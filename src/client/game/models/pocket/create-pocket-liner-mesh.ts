import { vec, type Vec } from '@common/math';
import { BufferGeometry, Mesh, TorusGeometry } from 'three';
import { params } from '../../../../common/simulation/physics';
import { createMaterial } from '../../rendering/create-material';
import { makeTheme } from '../../store/theme';
import { createRoundedRect, subtract } from '../util';

const getMouthDirection = (position: Vec) => {
  const dir = vec.new(0, 0);

  // top or bottom
  dir[1] = position[1] > 0 ? -1 : 1;
  // left, middle, right
  dir[0] = position[0] === 0 ? 0 : position[0] > 0 ? -1 : 1;

  return vec.norm(dir);
};

export const createPocketLinerMesh = (pocket: {
  position: Vec;
  radius: number;
}) => {
  const mouthDirection = getMouthDirection(pocket.position);
  const isCorner = mouthDirection[0] !== 0;
  const width = isCorner
    ? params.pocket.corner.overlap
    : params.pocket.edge.overlap;
  const radius = pocket.radius;

  let geometry: BufferGeometry = new TorusGeometry(
    radius - width / 2,
    width / 2
  ).translate(0, 0, -pocket.position[2]);

  const height = params.ball.radius * 2;
  const tableInner = createRoundedRect(
    params.table.length,
    params.table.width,
    0,
    { depth: height * 2, bevelEnabled: false }
  ).translate(-pocket.position[0], -pocket.position[1], height);

  geometry = subtract(geometry, tableInner);

  const mesh = new Mesh(
    geometry,
    createMaterial({
      color: makeTheme().table.colorPocketLiner,
      roughness: 0.5,
      metalness: 0,
    })
  );
  mesh.receiveShadow = true;
  return mesh;
};
