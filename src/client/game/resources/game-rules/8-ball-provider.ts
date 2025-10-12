import { Ruleset } from '@common/simulation/physics';
import type { RuleProvider } from './types';

export const get8BallRules: RuleProvider = (balls, { turn, isBreak }) => {
  if (isBreak) {
    return {
      ruleset: Ruleset._8Ball,
      validTargets: balls.slice(0, 3),
      invalidPottable: [8],
      invalidTargets: [],
      validPottable: balls.filter((id) => id !== 8),
      pottable: balls.filter((id) => id !== 8),
    };
  }

  if (!turn || turn === 'open') {
    return {
      ruleset: Ruleset._8Ball,
      validTargets: balls.filter((id) => id !== 8),
      invalidPottable: [8],
      invalidTargets: [],
      validPottable: balls.filter((id) => id !== 8),
      pottable: balls.filter((id) => id !== 8),
    };
  }

  const targets =
    turn === 'solids'
      ? balls.filter((id) => id < 8)
      : balls.filter((id) => id > 8);
  const on8Ball = targets.length === 0;

  return {
    ruleset: Ruleset._8Ball,
    validTargets: on8Ball ? [8] : targets,
    invalidPottable: on8Ball ? [] : [8],
    invalidTargets: [],
    validPottable: on8Ball ? [8] : targets,
    pottable: balls.filter((id) => id !== 8),
  };
};
