import { createSystem } from '@common/ecs/func';
import { vec } from '@common/math';
import type { Camera } from 'three';
import type { OrbitControls } from 'three/examples/jsm/Addons.js';
import { SystemState } from '../../resources/system-state';
import { toVector3 } from '../../util/three-interop';
import { Cue } from './cue.component';

const LIFT = 0.4;

export const createCueCameraSystem = (
  camera: Camera,
  controls: OrbitControls
) =>
  createSystem([Cue], (ecs, entity) => {
    const system = ecs.resource(SystemState);
    if (!system.cueFocused) return;

    const [cue] = ecs.get(entity, Cue);

    const angleZ = cue.angle - Math.PI;
    const angleNormal = vec.new(Math.cos(angleZ), Math.sin(angleZ));
    const targetCameraPosition = vec.add(
      cue.target,
      vec.mult(angleNormal, (system.params.cue.length * 3) / 4)
    );

    camera.position.copy(toVector3(targetCameraPosition));
    camera.position.z += LIFT / 2;
    controls.target.copy(toVector3(cue.target));
    camera.lookAt(toVector3(cue.target));
    camera.position.z += LIFT / 2;
  });
