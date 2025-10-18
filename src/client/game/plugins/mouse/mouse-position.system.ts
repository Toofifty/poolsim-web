import { createEventSystemFactory } from '@common/ecs/func';
import { vec, type Vec } from '@common/math';
import { assertExists } from '@common/util';
import { Object3D, Raycaster, type Camera } from 'three';
import type { GameEvents } from '../../events';
import { toVec, toVector2 } from '../../util/three-interop';
import { MousePosition } from './mouse-position.resource';
import { PlaneMesh } from './plane-mesh.component';
import { Plane } from './plane.component';

export const createMousePositionSystem = (camera: Camera) => {
  const raycaster = new Raycaster();

  const intersect = (screen: Vec, object: Object3D): Vec | undefined => {
    raycaster.setFromCamera(toVector2(screen), camera);
    const intersections = raycaster.intersectObject(object);
    if (intersections.length > 0) {
      return toVec(intersections[0].point);
    }
    return undefined;
  };

  return createEventSystemFactory<GameEvents>()(
    'input/mouse-move',
    (ecs, data) => {
      const mousePosition = ecs.resource(MousePosition);
      vec.mset(mousePosition.screen, data.x, data.y, 0);

      const planeEntity = ecs.query().firstWith(Plane);
      assertExists(planeEntity, 'Missing intersection plane');

      const [{ mesh }] = ecs.get(planeEntity, PlaneMesh);

      const world = intersect(mousePosition.screen, mesh);
      if (world) {
        vec.mcopy(mousePosition.world, world);
      }
    }
  );
};
