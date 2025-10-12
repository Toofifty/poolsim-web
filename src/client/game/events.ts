import type { Entity } from '@common/ecs';
import type { Shot } from '@common/simulation/shot';
import type { Quat, Vec } from '../../common/math';
import type { RuleSet } from '../../common/simulation/physics';
import type { Cue } from './plugins/cue/cue.component';
import type {
  BallBallCollision,
  BallCushionCollision,
  BallPocketCollision,
} from './plugins/physics/collision/types';
import type { Sandboxes } from './rack';

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
  'game/start-shooting': {};
  'game/shoot': {
    targetEntity: Entity;
    shot: Shot;
  };
  /** Called when no balls are moving and we can update the state */
  'game/settled': {};
  'game/ball-collision': BallBallCollision;
  'game/cushion-collision': BallCushionCollision;
  'game/pocket-collision': BallPocketCollision;
  'game/cue-update': Cue;

  'input/mouse-move': {
    x: number;
    y: number;
    original: MouseEvent | TouchEvent;
  };
  'input/mouse-pressed': {
    button: number;
    original: MouseEvent;
  };
  'input/key-pressed': {
    key: string;
    original: KeyboardEvent;
  };
  'input/lock-cue': {};
  'input/cue-update': {
    force?: number;
    top?: number;
    side?: number;
    lift?: number;
  };
  'input/setup-game':
    | { ruleSet: RuleSet._8Ball | RuleSet._9Ball }
    | {
        ruleSet: RuleSet.Sandbox | RuleSet.SandboxSequential;
        sandbox: Sandboxes;
      };
};
