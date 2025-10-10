import type { Entity } from '@common/ecs';
import type { Shot } from '@common/simulation/shot';
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
  'game/shoot': {
    targetEntity: Entity;
    shot: Shot;
  };

  'input/mouse-move': {
    x: number;
    y: number;
    original: MouseEvent | TouchEvent;
  };
  'input/mouse-pressed': {
    button: number;
    original: MouseEvent;
  };
};
