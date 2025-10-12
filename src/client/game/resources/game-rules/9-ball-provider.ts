import { Ruleset } from '@common/simulation/physics';
import type { RuleProvider } from './types';

export const get9BallRules: RuleProvider = (balls) => {
  const min = Math.min(...balls);

  return {
    ruleset: Ruleset._9Ball,
    validTargets: [min],
    invalidPottable: [],
    invalidTargets: [],
    validPottable: balls,
    pottable: balls,
  };
};
