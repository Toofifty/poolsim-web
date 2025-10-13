import type { Entity } from '@common/ecs';
import type { Shot } from '@common/simulation/shot';
import type { EightBallState } from '@common/simulation/table-state';
import type { Quat, Vec } from '../../common/math';
import type { Ruleset } from '../../common/simulation/physics';
import type { Cue } from './plugins/cue/cue.component';
import type {
  BallBallCollision,
  BallCushionCollision,
  BallPocketCollision,
} from './plugins/physics/collision/types';
import type { Result, TurnFoul } from './plugins/physics/simulation/result';
import type { Sandboxes } from './rack';
import type { GameRules } from './resources/game-rules/types';
import type { GameState } from './resources/system-state';

export type GameEvents = {
  'game/state-update': GameState;
  'game/current-player-update': number;
  'game/change-player': number;
  'game/setup': {
    rack: {
      id: number;
      number: number;
      color: number;
      position: Vec;
      orientation: Quat;
    }[];
    ruleset: Ruleset;
  };
  'game/start-shooting': {};
  'game/shoot': {
    targetEntity: Entity;
    shot: Shot;
  };
  /** Called when no balls are moving and we can update the state */
  'game/settled': {
    result: Result;
    rules: GameRules;
  };
  'game/ball-collision': BallBallCollision;
  'game/cushion-collision': BallCushionCollision;
  'game/pocket-collision': BallPocketCollision;
  'game/ball-ejected': number;
  'game/foul': TurnFoul;
  'game/game-over': {
    winner: number;
  };
  'game/cue-update': Cue;
  'game/8-ball-state-change': {
    state: EightBallState;
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
    | { ruleset: Ruleset._8Ball | Ruleset._9Ball }
    | {
        ruleset: Ruleset.Sandbox | Ruleset.SandboxSequential;
        sandbox: Sandboxes;
      };
};
