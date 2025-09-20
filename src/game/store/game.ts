import { proxy } from 'valtio';
import { GameState } from '../game-manager';
import { properties } from '../physics/properties';

export const gameStore = proxy({
  state: undefined as GameState | undefined,
  cueForce: properties.cueDefaultForce,
  /** (-1, 1) of hit on ball */
  cueSpinX: 0,
  /** (-1, 1) of hit on ball */
  cueSpinY: 0,
  analysisProgress: 0,
});
