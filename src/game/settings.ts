import { proxy } from 'valtio';

export const settings = proxy({
  canvasEnabled: true,
  debugLights: false,
  debugBalls: false,
  debugCollisionBoxes: false,
  enableProfiler: false,
});
