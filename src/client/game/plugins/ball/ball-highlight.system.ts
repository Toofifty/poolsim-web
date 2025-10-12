import { ECS, System, type Entity } from '@common/ecs';
import { BallId } from '../../components/ball-id';
import { PlayState } from '../../controller/game-controller';
import { GameRuleProvider } from '../../resources/game-rules';
import type { GameRules } from '../../resources/game-rules/types';
import { SystemState } from '../../resources/system-state';
import { getActiveBallIds } from '../gameplay/get-active-ball-ids';
import { Physics } from '../physics/physics.component';
import { BallHighlight } from './ball-highlight.component';

export class BallHighlightSystem extends System {
  public components: Set<Function> = new Set([BallId, Physics]);

  private rules?: GameRules;

  public before(ecs: ECS<any, unknown>, entities: Set<Entity>): boolean {
    const ruleProvider = ecs.resource(GameRuleProvider);
    const systemState = ecs.resource(SystemState);

    this.rules = ruleProvider.getRules(getActiveBallIds(ecs, entities), {
      isBreak: systemState.isBreak,
      turn: systemState.currentPlayer8BallState,
    });

    return true;
  }

  public run(ecs: ECS<any, unknown>, entity: Entity): void {
    if (!this.rules) return;
    const systemState = ecs.resource(SystemState);

    const [{ id }] = ecs.get(entity, BallId);
    const components = ecs.getComponents(entity);
    const shouldHighlight =
      systemState.playState === PlayState.PlayerShoot &&
      this.rules.validTargets.includes(id);
    const shouldHighlightRed =
      systemState.playState === PlayState.PlayerShoot &&
      this.rules.invalidTargets.includes(id);
    const hasHighlight = components.has(BallHighlight);

    if (!hasHighlight) {
      if (shouldHighlight) {
        const [physics] = ecs.get(entity, Physics);
        ecs.addComponent(
          entity,
          BallHighlight.create({ position: physics.r, color: 'light' })
        );
      } else if (shouldHighlightRed) {
        const [physics] = ecs.get(entity, Physics);
        ecs.addComponent(
          entity,
          BallHighlight.create({ position: physics.r, color: 'red' })
        );
      }
    }

    if (!(shouldHighlight || shouldHighlightRed) && hasHighlight) {
      ecs.removeComponent(entity, BallHighlight);
    }
  }
}
