import { ECS, Plugin } from '@common/ecs';
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
export class BallPlugin extends Plugin {
  public install(ecs: ECS<GameEvents>): void {
    ecs.addSystem(new BallHighlightSystem());
    ecs.addSystem(new BallTableIndicatorSystem());

    // debug
    ecs.addEventSystem(new BallDebugSystem());
    ecs.addSystem(new BallDebugUArrowUpdateSystem());
    ecs.addSystem(new BallDebugVArrowUpdateSystem());
    ecs.addSystem(new BallDebugWArrowUpdateSystem());
    ecs.addSystem(new BallDebugRingUpdateSystem());
  }
}
