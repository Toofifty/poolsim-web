import type { RuleProvider } from './types';

export const get9BallRules: RuleProvider = (balls) => {
  const min = Math.min(...balls);

  return {
    validTargets: [min],
    invalidPottable: [],
    invalidTargets: [],
    validPottable: balls,
    pottable: balls,
  };
};
