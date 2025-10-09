import type { Quat, Vec } from '../../common/math';
import type { RuleSet } from '../../common/simulation/physics';

export type GameEvents = {
  'game/setup': {
    rack: {
      id: number;
      number: number;
      color: number;
      position: Vec;
      orientation: Quat;
    }[];
    ruleSet: RuleSet;
  };
};
