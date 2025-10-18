import { createPlugin } from '@common/ecs/func';
import type { GameEvents } from '../../events';
import { CueLockSystem } from './cue-lock.system';
import { CueSetupSystem } from './cue-setup.system';
import { animateCueShootSystem, startCueShootSystem } from './cue-shoot.system';
import { CueTargetSystem } from './cue-target.system';
import { CueUIUpdateSystem } from './cue-ui-update.system';
import { CueUpdateSystem } from './cue-update.system';

export const cuePlugin = createPlugin<GameEvents>((ecs) => {
  ecs.addStartupSystem(new CueSetupSystem());
  const cueTargetSystem = ecs.addSystem(new CueTargetSystem());
  const cueUpdateSystem = ecs.addSystem(new CueUpdateSystem());

  ecs.addEventSystem(startCueShootSystem);
  ecs.addEventSystem(animateCueShootSystem);
  const cueUIUpdateSystem = ecs.addEventSystem(new CueUIUpdateSystem());
  const cueLockSystem = ecs.addEventSystem(new CueLockSystem());

  return () => {
    ecs.removeSystem(cueTargetSystem);
    ecs.removeSystem(cueUpdateSystem);
    ecs.removeEventSystem(startCueShootSystem);
    ecs.removeEventSystem(animateCueShootSystem);
    ecs.removeEventSystem(cueUIUpdateSystem);
    ecs.removeEventSystem(cueLockSystem);
  };
});
