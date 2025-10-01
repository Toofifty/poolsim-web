import { CylinderGeometry, Mesh, Object3D, SphereGeometry } from 'three';
import type { Params } from '../../../../common/simulation/physics';
import { createMaterial } from '../../rendering/create-material';
import type { ThemeObject } from '../../store/theme';

// todo: just use a texture for the cue

export const createCueMeshes = (params: Params, theme: ThemeObject) => {
  const {
    cue: { tipRadius, length, handleRadius },
  } = params;

  const anchor = new Object3D();
  const lift = new Object3D();
  const cue = new Object3D();

  const tip = new Mesh(
    new SphereGeometry(tipRadius),
    createMaterial({ color: theme.cue.colorTip })
  );
  tip.position.y = length / 2;
  const handlePct = 0.25;
  const handleLength = length * handlePct;
  const shaftLength = length - handleLength;
  const cueMidRadius = tipRadius + (handleRadius - tipRadius) * handlePct;
  const shaft = new Mesh(
    new CylinderGeometry(tipRadius, cueMidRadius, shaftLength),
    createMaterial({
      color: theme.cue.colorShaft,
      roughness: 0.1,
      metalness: 0,
    })
  );
  shaft.position.y = handleLength / 2;
  const handle = new Mesh(
    new CylinderGeometry(cueMidRadius, handleRadius, handleLength),
    createMaterial({
      color: theme.cue.colorHandle,
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

  return { cue, lift, anchor };
};
