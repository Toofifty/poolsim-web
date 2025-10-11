import { ECS, Plugin } from '@common/ecs';
import { GuidelineArrowUpdateSystem } from './guideline-arrow-update.system';
import { GuidelineSetupSystem } from './guideline-setup-system';
import { GuidelineTargetSystem } from './guideline-target.system';
import { GuidelineUpdateSystem } from './guideline-update.system';

/**
 * Used for non-cheaty guidelines
 */
export class GuidelinePlugin extends Plugin {
  public install(ecs: ECS): void {
    // todo: enable/disable based on params
    ecs.addStartupSystem(new GuidelineSetupSystem());
    ecs.addSystem(new GuidelineTargetSystem());
    ecs.addSystem(new GuidelineUpdateSystem());
    ecs.addSystem(new GuidelineArrowUpdateSystem());
  }
}
