import { proxy } from 'valtio';

export enum AimAssistMode {
  Off,
  FirstContact,
  Full,
}

export enum Players {
  PlayerVsPlayer,
  PlayerVsAI,
  AIVsAI,
}

export const settings = proxy({
  aimAssistMode: AimAssistMode.Off,

  highDetail: false,
  ortho: false,
  players: Players.PlayerVsPlayer,

  canvasEnabled: true,
  debugLights: false,
  debugBalls: false,
  debugCollisionBoxes: false,
  enableProfiler: false,
});
