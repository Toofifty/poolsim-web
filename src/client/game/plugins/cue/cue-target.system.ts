import type { ECS } from '@common/ecs';
import {
  createEventSystemFactory,
  createSystemFactory,
} from '@common/ecs/func';
import { vec, type Vec } from '@common/math';
import { assertExists } from '@common/util';
import { Object3D, Raycaster, type Camera } from 'three';
import type { GameEvents } from '../../events';
import { SystemState } from '../../resources/system-state';
import { settings } from '../../store/settings';
import { toVec, toVector2 } from '../../util/three-interop';
import { maybeFindBallById } from '../gameplay/find-ball-by-id';
import { InHand } from '../gameplay/in-hand.component';
import { MousePosition } from '../mouse/mouse-position.resource';
import { PlaneMesh } from '../mouse/plane-mesh.component';
import { Plane } from '../mouse/plane.component';
import { Cue } from './cue.component';

const createSystem = createSystemFactory<GameEvents>();

/**
 * Moves cue to target ball
 */
export const cueBallTargetSystem = createSystem([Cue], (ecs, entity) => {
  const system = ecs.resource(SystemState);
  if (!system.isShootable || !system.isActivePlayer) {
    return;
  }

  const ballInHandEntity = ecs.query().has(InHand).findOne();
  if (ballInHandEntity !== undefined) return;

  const [cue] = ecs.get(entity, Cue);
  if (cue.targetId === undefined || cue.shooting) {
    return;
  }

  const [_, ball] = maybeFindBallById(ecs, cue.targetId);
  if (!ball) return;
  vec.mcopy(cue.target, vec.setZ(ball.r, ball.R));
});

/**
 * Move cue to point at cursor
 */
export const cueCursorTargetSystem = createSystem([Cue], (ecs, entity) => {
  if (settings.controlMode !== 'cursor') return;

  const system = ecs.resource(SystemState);
  if (!system.isShootable || !system.isActivePlayer || system.cueFocused) {
    return;
  }

  const ballInHandEntity = ecs.query().has(InHand).findOne();
  if (ballInHandEntity !== undefined) return;

  const [cue] = ecs.get(entity, Cue);
  if (cue.targetId === undefined || cue.shooting || cue.locked) {
    return;
  }

  const [_, ball] = maybeFindBallById(ecs, cue.targetId);
  if (!ball) return;

  const mouse = ecs.resource(MousePosition);
  // only update cue if cursor is not too close
  if (vec.dist(cue.target, mouse.world) > ball.R * 4) {
    cue.angle = vec.angle2D(cue.target, mouse.world);
  }

  ecs.emit('game/cue-update', cue);
});

/**
 * Drag cue with touch controls
 */
export const createCueTouchTargetSystems = (camera: Camera) => {
  const raycaster = new Raycaster();

  const intersect = (screen: Vec, object: Object3D): Vec | undefined => {
    raycaster.setFromCamera(toVector2(screen), camera);
    const intersections = raycaster.intersectObject(object);
    if (intersections.length > 0) {
      return toVec(intersections[0].point);
    }
    return undefined;
  };

  const createEventSystem = createEventSystemFactory<GameEvents>();

  const shouldUpdateCue = (ecs: ECS<GameEvents>) => {
    if (settings.controlMode !== 'touch' || settings.enableZoomPan) {
      return false;
    }

    const system = ecs.resource(SystemState);
    if (!system.isShootable || !system.isActivePlayer || system.cueFocused) {
      return false;
    }

    const ballInHandEntity = ecs.query().has(InHand).findOne();
    if (ballInHandEntity !== undefined) {
      return false;
    }

    return true;
  };

  let last: Vec | undefined = undefined;

  const onTouchStart = createEventSystem('input/touch-start', (ecs, data) => {
    if (!shouldUpdateCue(ecs)) return;

    const planeEntity = ecs.query().firstWith(Plane);
    assertExists(planeEntity, 'Missing intersection plane');

    const [{ mesh }] = ecs.get(planeEntity, PlaneMesh);
    last = intersect(data.position, mesh);
  });

  const onTouchMove = createEventSystem('input/touch-move', (ecs, data) => {
    if (!shouldUpdateCue(ecs)) return;

    const cue = ecs.query().resolveFirst(Cue);
    assertExists(cue);
    if (cue.targetId === undefined || cue.shooting || cue.locked) {
      return;
    }

    const planeEntity = ecs.query().firstWith(Plane);
    assertExists(planeEntity, 'Missing intersection plane');

    const [{ mesh }] = ecs.get(planeEntity, PlaneMesh);
    const touch = intersect(data.position, mesh);
    if (!touch) return;

    if (last) {
      const lastToCue = vec.sub(cue.target, last);
      const touchToCue = vec.sub(cue.target, touch);
      const lastAngle = Math.atan2(lastToCue[1], lastToCue[0]);
      const touchAngle = Math.atan2(touchToCue[1], touchToCue[0]);
      cue.angle += touchAngle - lastAngle;

      ecs.emit('game/cue-update', cue);
    }

    last = touch;
  });

  return [onTouchStart, onTouchMove];
};
