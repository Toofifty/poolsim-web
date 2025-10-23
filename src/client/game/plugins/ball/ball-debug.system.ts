import type { ECS } from '@common/ecs';
import type { GameEvents } from '../../events';
import { settings } from '../../store/settings';
import { SettingUpdateSystem } from '../../systems/setting-update.system';
import { Physics } from '../physics/physics.component';
import {
  BallDebugUArrow,
  BallDebugVArrow,
  BallDebugWArrow,
} from './ball-debug-arrow.component';
import { BallRing } from './ball-ring.component';

export class BallDebugSystem extends SettingUpdateSystem {
  public test = (mutated: GameEvents['game/setting-update']['mutated']) =>
    mutated.includes('debugBalls');

  public onChange(ecs: ECS<GameEvents, unknown>): void {
    const ballEntities = ecs.query().has(Physics).findAll();
    if (ballEntities.length === 0) return;

    const hasDebug = ecs.get(ballEntities[0], BallRing)[0] !== undefined;
    const shouldHaveDebug = settings.debugBalls;

    if (!hasDebug && shouldHaveDebug) {
      ballEntities.forEach((entity) => {
        const [ball] = ecs.get(entity, Physics);
        ecs.addComponent(entity, BallRing.create(ball));
        ecs.addComponent(entity, BallDebugUArrow.create(), BallDebugUArrow);
        ecs.addComponent(entity, BallDebugVArrow.create(), BallDebugVArrow);
        ecs.addComponent(entity, BallDebugWArrow.create(), BallDebugWArrow);
      });
    } else if (hasDebug && !shouldHaveDebug) {
      ballEntities.forEach((entity) => {
        ecs.removeComponent(entity, BallRing);
        ecs.removeComponent(entity, BallDebugUArrow);
        ecs.removeComponent(entity, BallDebugVArrow);
        ecs.removeComponent(entity, BallDebugWArrow);
      });
    }
  }
}
