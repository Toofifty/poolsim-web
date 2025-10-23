import { Ruleset } from '@common/simulation/physics';
import type { RuleProvider } from './types';

export const getSandboxSequentialRules: RuleProvider = (balls) => {
  const min = Math.min(...balls);

  return {
    ruleset: Ruleset.SandboxSequential,
    validTargets: [min],
    invalidPottable: balls.filter((id) => id !== min),
    invalidTargets: balls.filter((id) => id !== min),
    validPottable: [min],
    pottable: [],
  };
};
