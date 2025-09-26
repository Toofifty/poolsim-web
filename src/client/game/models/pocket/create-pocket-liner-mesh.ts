import { BufferGeometry, Mesh, TorusGeometry } from 'three';
import type { Pocket } from '../../objects/pocket';
import { createMaterial } from '../../rendering/create-material';
import { createRoundedRect, subtract } from '../util';
import { makeTheme } from '../../store/theme';
import { params } from '../../../../common/simulation/physics';

export const createPocketLinerMesh = (pocket: Pocket) => {
  const mouthDirection = pocket.mouthDirection;
  const isCorner = mouthDirection.x !== 0;
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
