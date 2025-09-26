import { proxy } from 'valtio';
import { properties } from '../../../common/simulation/physics/properties';
import { GameState } from '../game-manager';

export const gameStore = proxy({
  state: undefined as GameState | undefined,
  cueForce: properties.cueDefaultForce,
  /** (-1, 1) of hit on ball */
  cueSpinX: 0,
  /** (-1, 1) of hit on ball */
  cueSpinY: 0,
  /** (0, pi/2) of the vertical angle of the cue */
  cueLift: 0,
  analysisProgress: 0,
});
