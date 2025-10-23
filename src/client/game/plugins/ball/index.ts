import { createPlugin } from '@common/ecs/func';
import type { GameEvents } from '../../events';
import {
  BallDebugUArrowUpdateSystem,
  BallDebugVArrowUpdateSystem,
  BallDebugWArrowUpdateSystem,
} from './ball-debug-arrow-update.system';
import { BallDebugRingUpdateSystem } from './ball-debug-ring-update.system';
import { BallDebugSystem } from './ball-debug.system';
import { BallHighlightSystem } from './ball-highlight.system';
import { BallTableIndicatorSystem } from './ball-table-indicator.system';

/**
 * Ball-adjacent features, not including physics.
 */
export const ballPlugin = createPlugin<GameEvents>((ecs) => {
  const highlightSystem = ecs.addSystem(new BallHighlightSystem());
  const tableIndicatorSystem = ecs.addSystem(new BallTableIndicatorSystem());

  // debug
  const debugSystem = ecs.addEventSystem(new BallDebugSystem());
  const uArrowSystem = ecs.addSystem(new BallDebugUArrowUpdateSystem());
  const vArrowSystem = ecs.addSystem(new BallDebugVArrowUpdateSystem());
  const wArrowSystem = ecs.addSystem(new BallDebugWArrowUpdateSystem());
  const debugRingSystem = ecs.addSystem(new BallDebugRingUpdateSystem());

  return () => {
    ecs.removeSystem(highlightSystem);
    ecs.removeSystem(tableIndicatorSystem);
    ecs.removeEventSystem(debugSystem);
    ecs.removeSystem(uArrowSystem);
    ecs.removeSystem(vArrowSystem);
    ecs.removeSystem(wArrowSystem);
    ecs.removeSystem(debugRingSystem);
  };
});
