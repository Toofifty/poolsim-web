import { proxy } from 'valtio';
import { GameState } from '../game-manager';
import { properties } from '../physics/properties';

export const gameStore = proxy({
  state: undefined as GameState | undefined,
  cueForce: properties.cueDefaultForce,
  analysisProgress: 0,
});
