import { createPlugin } from '@common/ecs/func';
import type { GameEvents } from '../../events';
import { GuidelineArrowUpdateSystem } from './guideline-arrow-update.system';
import { destroyGuidelines, setupGuidelines } from './guideline-setup.system';
import { GuidelineTargetSystem } from './guideline-target.system';
import { GuidelineUpdateSystem } from './guideline-update.system';

/**
 * Used for non-cheaty guidelines
 */
export const guidelinePlugin = createPlugin<GameEvents>((ecs) => {
  ecs.addStartupSystem(setupGuidelines);
  const targetSystem = ecs.addSystem(new GuidelineTargetSystem());
  const updateSystem = ecs.addSystem(new GuidelineUpdateSystem());
  const arrowSystem = ecs.addSystem(new GuidelineArrowUpdateSystem());

  return () => {
    ecs.addStartupSystem(destroyGuidelines);
    ecs.removeSystem(targetSystem);
    ecs.removeSystem(updateSystem);
    ecs.removeSystem(arrowSystem);
  };
});
