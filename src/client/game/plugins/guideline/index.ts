import { createPlugin } from '@common/ecs/func';
import type { GameEvents } from '../../events';
import { GuidelineArrowUpdateSystem } from './guideline-arrow-update.system';
import { GuidelineSetupSystem } from './guideline-setup-system';
import { GuidelineTargetSystem } from './guideline-target.system';
import { GuidelineUpdateSystem } from './guideline-update.system';

/**
 * Used for non-cheaty guidelines
 */
export const guidelinePlugin = createPlugin<GameEvents>((ecs) => {
  // todo: enable/disable based on params
  ecs.addStartupSystem(new GuidelineSetupSystem());
  const targetSystem = ecs.addSystem(new GuidelineTargetSystem());
  const updateSystem = ecs.addSystem(new GuidelineUpdateSystem());
  const arrowSystem = ecs.addSystem(new GuidelineArrowUpdateSystem());

  return () => {
    ecs.removeSystem(targetSystem);
    ecs.removeSystem(updateSystem);
    ecs.removeSystem(arrowSystem);
  };
});
