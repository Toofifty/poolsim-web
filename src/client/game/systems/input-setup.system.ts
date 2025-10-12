import { ECS, EventSystem } from '@common/ecs';
import { defaultParams, RuleSet } from '@common/simulation/physics';
import type { GameEvents } from '../events';
import { Rack } from '../rack';

export class InputSetupSystem extends EventSystem<
  'input/setup-game',
  GameEvents
> {
  public event = 'input/setup-game' as const;
  public run(
    ecs: ECS<GameEvents, unknown>,
    data: GameEvents['input/setup-game']
  ): void {
    if (data.ruleSet === RuleSet._8Ball) {
      ecs.emit('game/setup', {
        rack: Rack.generate8Ball(Rack.getTip(defaultParams)),
        ruleSet: data.ruleSet,
      });
    }

    if (data.ruleSet === RuleSet._9Ball) {
      ecs.emit('game/setup', {
        rack: Rack.generate9Ball(Rack.getTip(defaultParams)),
        ruleSet: data.ruleSet,
      });
    }

    if (
      data.ruleSet === RuleSet.Sandbox ||
      data.ruleSet === RuleSet.SandboxSequential
    ) {
      ecs.emit('game/setup', {
        rack: Rack.generateSandboxGame(defaultParams, data.sandbox),
        ruleSet: data.ruleSet,
      });
    }
  }
}
