import { ECS, Plugin } from '@common/ecs';
import { CueLockSystem } from './cue-lock.system';
import { CueSetupSystem } from './cue-setup.system';
import { CueShootSystem } from './cue-shoot.system';
import { CueTargetSystem } from './cue-target.system';
import { CueUIUpdateSystem } from './cue-ui-update.system';
import { CueUpdateSystem } from './cue-update.system';

export class CuePlugin extends Plugin {
  public install(ecs: ECS): void {
    ecs.addStartupSystem(new CueSetupSystem());
    ecs.addSystem(new CueTargetSystem());
    ecs.addSystem(new CueUpdateSystem());

    ecs.addEventSystem(new CueShootSystem());
    ecs.addEventSystem(new CueUIUpdateSystem());
    ecs.addEventSystem(new CueLockSystem());
  }
}
