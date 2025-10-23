import { createEventSystemFactory, createPlugin } from '@common/ecs/func';
import type { GameEvents } from '../../events';
import type { Game } from '../../game';
import { SystemState } from '../../resources/system-state';
import { createCueCameraSystem } from './cue-camera.system';
import { cueFocusTargetSystem } from './cue-focus-target.system';
import { CueSetupSystem } from './cue-setup.system';
import { animateCueShootSystem, startCueShootSystem } from './cue-shoot.system';
import {
  createCueTouchTargetSystems,
  cueBallTargetSystem,
  cueCursorTargetSystem,
} from './cue-target.system';
import { CueUIUpdateSystem } from './cue-ui-update.system';
import { CueUpdateSystem } from './cue-update.system';
import { Cue } from './cue.component';

const createEventSystem = createEventSystemFactory<GameEvents>();

const cueLockSystem = createEventSystem('input/lock-cue', (ecs) => {
  const cue = ecs.query().resolveFirst(Cue);
  cue.locked = !cue.locked;
  ecs.emit('game/cue-update', cue);
});

const cueFocusSystem = createEventSystem('input/focus-cue', (ecs, focused) => {
  const system = ecs.resource(SystemState);
  system.cueFocused = focused ?? !system.cueFocused;
});

export const cuePlugin = createPlugin<GameEvents, Game>((ecs) => {
  ecs.addStartupSystem(new CueSetupSystem());
  ecs.addSystem(cueBallTargetSystem);
  ecs.addSystem(cueCursorTargetSystem);
  const [cueTouchStart, cueTouchMove] = createCueTouchTargetSystems(
    ecs.game.camera
  );
  ecs.addEventSystem(cueTouchStart);
  ecs.addEventSystem(cueTouchMove);
  const cueUpdateSystem = ecs.addSystem(new CueUpdateSystem());
  const cueCameraSystem = ecs.addSystem(
    createCueCameraSystem(ecs.game.camera, ecs.game.controls)
  );
  ecs.addEventSystem(cueFocusTargetSystem);

  ecs.addEventSystem(startCueShootSystem);
  ecs.addEventSystem(animateCueShootSystem);
  const cueUIUpdateSystem = ecs.addEventSystem(new CueUIUpdateSystem());
  ecs.addEventSystem(cueLockSystem);
  ecs.addEventSystem(cueFocusSystem);

  return () => {
    ecs.removeSystem(cueCursorTargetSystem);
    ecs.removeSystem(cueBallTargetSystem);
    ecs.removeEventSystem(cueTouchStart);
    ecs.removeEventSystem(cueTouchMove);
    ecs.removeSystem(cueUpdateSystem);
    ecs.removeSystem(cueCameraSystem);
    ecs.removeEventSystem(cueFocusTargetSystem);
    ecs.removeEventSystem(startCueShootSystem);
    ecs.removeEventSystem(animateCueShootSystem);
    ecs.removeEventSystem(cueUIUpdateSystem);
    ecs.removeEventSystem(cueLockSystem);
    ecs.removeEventSystem(cueFocusSystem);
  };
});
