import { ECS, Plugin } from '@common/ecs';
import { BallHighlightSystem } from './ball-highlight.system';
import { BallTableIndicatorSystem } from './ball-table-indicator.system';

/**
 * Ball-adjacent features, not including physics.
 */
export class BallPlugin extends Plugin {
  public install(ecs: ECS): void {
    ecs.addSystem(new BallHighlightSystem());
    ecs.addSystem(new BallTableIndicatorSystem());
  }
}
