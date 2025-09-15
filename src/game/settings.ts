import { proxy } from 'valtio';

export enum AimAssistMode {
  Off,
  FirstContact,
  Full,
}

export const settings = proxy({
  aimAssistMode: AimAssistMode.Off,

  canvasEnabled: true,
  debugLights: false,
  debugBalls: false,
  debugCollisionBoxes: false,
  enableProfiler: false,
});
