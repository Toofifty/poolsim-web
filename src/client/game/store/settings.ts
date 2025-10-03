import { proxy, subscribe } from 'valtio';
import { getIsMobile } from '../../ui/use-media-query';

export enum GraphicsDetail {
  Low,
  Medium,
  High,
}

export enum Players {
  PlayerVsPlayer,
  PlayerVsAI,
  AIVsAI,
}

const readFromStorage = <T>(def: T): T => {
  return JSON.parse(localStorage.getItem('pool:settings') ?? 'null') || def;
};

const isMobile = typeof window !== 'undefined' && getIsMobile();

export const settings = proxy({
  // not persisted - must also be removed from subscribe below
  players: Players.PlayerVsPlayer,
  enableZoomPan: !isMobile,
  controlMode: isMobile ? ('touch' as const) : ('cursor' as const),
  preferencesOpen: false,
  paramEditorOpen: false,
  pauseSimulation: false,
  lockCue: false,

  ...readFromStorage({
    detail: isMobile ? GraphicsDetail.Low : GraphicsDetail.Medium,
    ortho: false,
    highlightTargetBalls: true,
    physicsGuidelines: true,

    canvasEnabled: true,
    debugLights: false,
    debugBalls: false,
    debugCushions: false,
    enableProfiler: false,
    enableBallPickup: false,
  }),
});

subscribe(settings, () => {
  const {
    enableZoomPan,
    players,
    preferencesOpen,
    paramEditorOpen,
    pauseSimulation,
    lockCue,
    controlMode,
    ...serializable
  } = settings;
  localStorage.setItem('pool:settings', JSON.stringify(serializable));
});
