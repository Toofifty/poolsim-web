import { proxy } from 'valtio';
import { params } from '../../../common/simulation/physics';
import type { PlayState } from '../controller/game-controller';

export const gameStore = proxy({
  state: undefined as PlayState | undefined,
  cueForce: params.cue.defaultForce,
  /** (-1, 1) of hit on ball */
  cueSpinX: 0,
  /** (-1, 1) of hit on ball */
  cueSpinY: 0,
  /** (0, pi/2) of the vertical angle of the cue */
  cueLift: 0,
  analysisProgress: 0,
});
