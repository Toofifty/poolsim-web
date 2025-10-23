import type {
  EightBallState,
  Params,
  Ruleset,
} from '@common/simulation/physics';
import type { Shot } from '@common/simulation/shot';
import type { Quat, Vec } from '../../common/math';
import type { DeepKeyOf, DeepPathOf } from '../util/types';
import type { Cue } from './plugins/cue/cue.component';
import type {
  BallBallCollision,
  BallColliderCollision,
  BallPocketCollision,
} from './plugins/physics/collision/types';
import type { Physics } from './plugins/physics/physics.component';
import type { Result, TurnFoul } from './plugins/physics/simulation/result';
import type { Sandboxes } from './rack';
import type { GameRules } from './resources/game-rules/types';
import type { GameState } from './resources/system-state';
import type { settings } from './store/settings';

type BallProto = {
  id: number;
  number: number;
  color: number;
  position: Vec;
  orientation: Quat;
};

export type GameEvents = {
  'game/state-update': GameState;
  'game/current-player-update': number;
  'game/change-player': number;
  'game/param-update': {
    mutated: DeepPathOf<Params>[];
  };
  'game/setting-update': {
    mutated: DeepPathOf<typeof settings>[];
  };
  'game/setup': {
    rack: BallProto[];
    ruleset: Ruleset;
  };
  'game/start-shooting': {
    skipDrawback?: boolean;
  };
  'game/shoot': {
    /** Ball ID */
    id: number;
    shot: Shot;
  };
  /** Called when no balls are moving and we can update the state */
  'game/settled': {
    result: Result;
    rules: GameRules;
  };
  'game/ball-collision': BallBallCollision;
  'game/cushion-collision': BallColliderCollision;
  'game/pocket-collision': BallPocketCollision;
  'game/ball-ejected': number;
  'game/foul': TurnFoul;
  'game/game-over': {
    winner: number;
  };
  'game/cue-update': Cue;
  'game/focus-cue': boolean;
  'game/8-ball-state-change': {
    state: EightBallState;
  };
  'game/pickup-ball': { id: number };
  'game/move-ball': { id: number; position: Vec };
  'game/place-ball': { id: number; position: Vec };

  'input/mouse-move': {
    position: Vec;
    original: MouseEvent;
  };
  'input/touch-start': {
    position: Vec;
    original: TouchEvent;
  };
  'input/touch-move': {
    position: Vec;
    original: TouchEvent;
  };
  'input/mouse-pressed': {
    button: number;
    original: MouseEvent;
  };
  'input/key-pressed': {
    key: string;
    original: KeyboardEvent;
  };
  'input/drag': {
    button: 1 | 2;
    delta: Vec;
    original: MouseEvent | TouchEvent;
  };
  'input/lock-cue': {};
  'input/cue-update': {
    drawback?: number;
    force?: number;
    top?: number;
    side?: number;
    lift?: number;
  };
  'input/focus-cue': boolean | undefined;
  'input/setup-game':
    | { ruleset: Ruleset._8Ball | Ruleset._9Ball }
    | {
        ruleset: Ruleset.Sandbox | Ruleset.SandboxSequential;
        sandbox: Sandboxes;
      };
  'input/param-change': {
    key: DeepKeyOf<Params>;
    value: unknown;
  };

  // network
  'send/setup-table': {
    rack: BallProto[];
    ruleset: Ruleset;
  };
  'send/system-state': {
    gameState: GameState;
    eightBallState: EightBallState;
    turnIndex: number;
    playerCount: number;
    isBreak: boolean;
  };
  'send/pickup-ball': { id: number };
  'send/move-ball': {
    id: number;
    position: Vec;
  };
  'send/place-ball': {
    id: number;
    position: Vec;
  };
  'send/move-cue': Cue;
  'send/shoot': Cue;
  'send/params': Params;
  'send/physics-sync': {
    balls: Physics[];
  };

  'receive/setup-table': {
    rack: BallProto[];
    ruleset: Ruleset;
  };
  'receive/system-state': {
    gameState: GameState;
    eightBallState: EightBallState;
    turnIndex: number;
    playerCount: number;
    isBreak: boolean;
  };
  'receive/pickup-ball': { id: number };
  'receive/move-ball': {
    id: number;
    position: Vec;
  };
  'receive/place-ball': {
    id: number;
    position: Vec;
  };
  'receive/move-cue': Cue;
  'receive/shoot': Cue;
  'receive/params': Params;
  'receive/physics-sync': {
    balls: Physics[];
  };
};
