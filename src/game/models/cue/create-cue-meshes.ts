import {
  CylinderGeometry,
  Mesh,
  Object3D,
  SphereGeometry,
  Vector3,
} from 'three';
import { properties } from '../../physics/properties';
import { createMaterial } from '../../rendering/create-material';

export const createCueMeshes = () => {
  const anchor = new Object3D();
  const lift = new Object3D();
  lift.rotateOnAxis(new Vector3(1, 0, 0), -Math.PI / 48);
  const cue = new Object3D();

  const tip = new Mesh(
    new SphereGeometry(properties.cueTipRadius),
    createMaterial({ color: properties.colorCueTip })
  );
  tip.position.y = properties.cueLength / 2;
  const handlePct = 0.25;
  const handleLength = properties.cueLength * handlePct;
  const shaftLength = properties.cueLength - handleLength;
  const cueMidRadius =
    properties.cueTipRadius +
    (properties.cueHandleRadius - properties.cueTipRadius) * handlePct;
  const shaft = new Mesh(
    new CylinderGeometry(properties.cueTipRadius, cueMidRadius, shaftLength),
    createMaterial({
      color: properties.colorCueShaft,
      roughness: 0.1,
      metalness: 0,
    })
  );
  shaft.position.y = handleLength / 2;
  const handle = new Mesh(
    new CylinderGeometry(
      cueMidRadius,
      properties.cueHandleRadius,
      handleLength
    ),
    createMaterial({
      color: properties.colorCueHandle,
      roughness: 0.1,
      metalness: 0,
    })
  );
  handle.position.y = -shaftLength / 2;
  tip.castShadow = true;
  shaft.castShadow = true;
  handle.castShadow = true;

  cue.add(tip, shaft, handle);
  lift.add(cue);
  anchor.add(lift);

  return { cue, anchor };
};
