import {
  Mesh,
  SphereGeometry,
  TextureLoader,
  Vector2,
  type Color,
} from 'three';
import { properties } from '../../../../common/simulation/physics/properties';
import { createMaterial } from '../../rendering/create-material';
import { createBallTexture } from './create-ball-texture';

import normalMapUrl from '../../../assets/scratch_normal.png';

const normalMap = new TextureLoader().load(normalMapUrl);

export const createBallMesh = ({
  radius,
  color,
  number,
}: {
  radius: number;
  color: Color;
  number: number;
}) => {
  const geometry = new SphereGeometry(radius);
  const texture = createBallTexture({
    color,
    number,
  });
  const material = createMaterial({
    map: texture,
    roughness: 0.1,
    metalness: 0,
    normalMap,
    normalScale: new Vector2(0.5, 0.5),
  });
  const projectionMaterial = createMaterial({
    map: texture,
    roughness: 0.1,
    metalness: 0,
    transparent: true,
    opacity: properties.projectionOpacity,
  });

  const mesh = new Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return { mesh, projectionMaterial };
};
