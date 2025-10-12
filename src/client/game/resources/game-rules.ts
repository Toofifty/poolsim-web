import { Resource } from '@common/ecs';
import { Ruleset } from '@common/simulation/physics';
import { get8BallRules } from './game-rules/8-ball-provider';
import { get9BallRules } from './game-rules/9-ball-provider';
import { getSandboxRules } from './game-rules/sandbox-provider';
import { getSandboxSequentialRules } from './game-rules/sandbox-sequential-provider';
import type { GameRules, RuleProviderArgs } from './game-rules/types';

export class GameRuleProvider extends Resource {
  constructor(public ruleset = Ruleset._8Ball) {
    super();
  }

  // todo: cache rules
  public getRules(balls: number[], args: RuleProviderArgs): GameRules {
    switch (this.ruleset) {
      case Ruleset._8Ball:
        return get8BallRules(balls, args);
      case Ruleset._9Ball:
        return get9BallRules(balls, args);
      case Ruleset.SandboxSequential:
        return getSandboxSequentialRules(balls, args);
      case Ruleset.Sandbox:
      default:
        return getSandboxRules(balls, args);
    }
  }
}
