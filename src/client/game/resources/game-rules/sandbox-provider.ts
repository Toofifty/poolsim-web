import { Ruleset } from '@common/simulation/physics';
import type { RuleProvider } from './types';

export const getSandboxRules: RuleProvider = (balls) => {
  return {
    ruleset: Ruleset.Sandbox,
    validTargets: balls,
    invalidPottable: [],
    invalidTargets: [],
    validPottable: balls,
    pottable: balls,
  };
};
