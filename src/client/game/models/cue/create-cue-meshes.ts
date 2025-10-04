import { CylinderGeometry, Mesh, Object3D, SphereGeometry } from 'three';
import type { Params } from '../../../../common/simulation/physics';
import { createMaterial } from '../../rendering/create-material';
import { themed, type ThemeObject } from '../../store/theme';
import { createCueTexture } from './create-cue-texture';

const createTipMaterial = (theme: ThemeObject) =>
  createMaterial({ color: theme.cue.colorTip, roughness: 1 });
const createShaftMaterial = (params: Params, theme: ThemeObject) =>
  createMaterial({
    map: createCueTexture(params, theme),
    roughness: 0.1,
    metalness: theme.cue.metalness,
  });
const createCapMaterial = (theme: ThemeObject) =>
  createMaterial({
    color: theme.cue.colorHandle,
    roughness: 0.1,
    metalness: theme.cue.metalness,
  });

export const createCueMeshes = (params: Params, theme: ThemeObject) => {
  const {
    cue: { tipRadius, length, handleRadius },
  } = params;

  const anchor = new Object3D();
  const lift = new Object3D();
  const cue = new Object3D();

  const tip = new Mesh(new SphereGeometry(tipRadius), createTipMaterial(theme));
  tip.position.y = length / 2;
  const shaft = new Mesh(
    new CylinderGeometry(tipRadius, handleRadius, length),
    createShaftMaterial(params, theme)
  );
  const cap = new Mesh(
    new SphereGeometry(handleRadius),
    createCapMaterial(theme)
  );
  cap.position.y = -length / 2;
  tip.castShadow = true;
  shaft.castShadow = true;
  cap.castShadow = true;

  cue.add(tip, shaft, cap);
  lift.add(cue);
  anchor.add(lift);

  themed(
    (theme) => {
      tip.material.dispose();
      tip.material = createTipMaterial(theme);
      tip.material.needsUpdate = true;

      shaft.material.dispose();
      shaft.material = createShaftMaterial(params, theme);
      shaft.material.needsUpdate = true;

      cap.material.dispose();
      cap.material = createCapMaterial(theme);
      cap.material.needsUpdate = true;
    },
    { init: false }
  );

  return { cue, lift, anchor };
};
