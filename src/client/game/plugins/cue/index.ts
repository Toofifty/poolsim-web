import { createPlugin } from '@common/ecs/func';
import type { GameEvents } from '../../events';
import type { Game } from '../../game';
import { CueLockSystem } from './cue-lock.system';
import { CueSetupSystem } from './cue-setup.system';
import { animateCueShootSystem, startCueShootSystem } from './cue-shoot.system';
import {
  createCueTouchTargetSystems,
  cueCursorTargetSystem,
} from './cue-target.system';
import { CueUIUpdateSystem } from './cue-ui-update.system';
import { CueUpdateSystem } from './cue-update.system';

export const cuePlugin = createPlugin<GameEvents, Game>((ecs) => {
  ecs.addStartupSystem(new CueSetupSystem());
  ecs.addSystem(cueCursorTargetSystem);
  const [cueTouchStart, cueTouchMove] = createCueTouchTargetSystems(
    ecs.game.camera
  );
  ecs.addEventSystem(cueTouchStart);
  ecs.addEventSystem(cueTouchMove);
  const cueUpdateSystem = ecs.addSystem(new CueUpdateSystem());

  ecs.addEventSystem(startCueShootSystem);
  ecs.addEventSystem(animateCueShootSystem);
  const cueUIUpdateSystem = ecs.addEventSystem(new CueUIUpdateSystem());
  const cueLockSystem = ecs.addEventSystem(new CueLockSystem());

  return () => {
    ecs.removeSystem(cueCursorTargetSystem);
    ecs.removeEventSystem(cueTouchStart);
    ecs.removeEventSystem(cueTouchMove);
    ecs.removeSystem(cueUpdateSystem);
    ecs.removeEventSystem(startCueShootSystem);
    ecs.removeEventSystem(animateCueShootSystem);
    ecs.removeEventSystem(cueUIUpdateSystem);
    ecs.removeEventSystem(cueLockSystem);
  };
});
