import type { RuleProvider } from './types';

export const getSandboxRules: RuleProvider = (balls) => {
  return {
    validTargets: balls,
    invalidPottable: [],
    invalidTargets: [],
    validPottable: balls,
    pottable: balls,
  };
};
