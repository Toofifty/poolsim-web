import { Resource } from '@common/ecs';
import { RuleSet } from '@common/simulation/physics';
import { get8BallRules } from './game-rules/8-ball-provider';
import { get9BallRules } from './game-rules/9-ball-provider';
import { getSandboxRules } from './game-rules/sandbox-provider';
import { getSandboxSequentialRules } from './game-rules/sandbox-sequential-provider';
import type { GameRules, RuleProviderArgs } from './game-rules/types';

export class GameRuleProvider extends Resource {
  constructor(public ruleSet = RuleSet._8Ball) {
    super();
  }

  public getRules(balls: number[], args: RuleProviderArgs): GameRules {
    switch (this.ruleSet) {
      case RuleSet._8Ball:
        return get8BallRules(balls, args);
      case RuleSet._9Ball:
        return get9BallRules(balls, args);
      case RuleSet.SandboxSequential:
        return getSandboxSequentialRules(balls, args);
      case RuleSet.Sandbox:
      default:
        return getSandboxRules(balls, args);
    }
  }
}
