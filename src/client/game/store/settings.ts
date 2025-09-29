import { proxy } from 'valtio';
import { getIsMobile } from '../../ui/use-media-query';

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
  enableZoomPan: typeof window !== 'undefined' && !getIsMobile(),

  canvasEnabled: true,
  pauseSimulation: false,
  lockCue: false,
  debugLights: false,
  debugBalls: false,
  debugCollisionBoxes: false,
  enableProfiler: false,
  enableBallPickup: false,
});
