import { BufferGeometry, Mesh, TorusGeometry } from 'three';
import type { Pocket } from '../../objects/pocket';
import { properties } from '../../physics/properties';
import { createMaterial } from '../../rendering/create-material';
import { createRoundedRect, subtract } from '../util';

export const createPocketLinerMesh = (pocket: Pocket) => {
  const mouthDirection = pocket.mouthDirection;
  const isCorner = mouthDirection.x !== 0;
  const width = isCorner
    ? properties.pocketCornerOverlap
    : properties.pocketEdgeOverlap;
  const radius = pocket.radius;

  let geometry: BufferGeometry = new TorusGeometry(
    radius - width / 2,
    width / 2
  ).translate(0, 0, -pocket.position.z);

  const height = properties.ballRadius * 2;
  const tableInner = createRoundedRect(
    properties.tableLength,
    properties.tableWidth,
    0,
    { depth: height * 2, bevelEnabled: false }
  ).translate(-pocket.position.x, -pocket.position.y, height);

  geometry = subtract(geometry, tableInner);

  const mesh = new Mesh(
    geometry,
    createMaterial({
      color: properties.colorPocketLiner,
      roughness: 0.5,
      metalness: 0,
    })
  );
  mesh.receiveShadow = true;
  return mesh;
};
