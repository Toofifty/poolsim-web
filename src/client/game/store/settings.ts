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
  return {
    ...def,
    ...JSON.parse(localStorage.getItem('pool:settings') ?? '{}'),
  };
};

const isMobile = typeof window !== 'undefined' && getIsMobile();

/**
 * Access in ECS:
 * Do not subscribe to this directly. Use a SettingUpdateSystem to be
 * notified about specific mutations.
 */
export const settings = proxy({
  // not persisted - must also be removed from subscribe below
  players: Players.PlayerVsPlayer,
  enableZoomPan: !isMobile,
  controlMode: isMobile ? ('touch' as const) : ('cursor' as const),
  pullToShoot: isMobile,
  preferencesOpen: false,
  paramEditorOpen: false,
  spinControlOpen: false,
  pauseSimulation: false,
  lockCue: false,

  ...readFromStorage({
    detail: isMobile ? GraphicsDetail.Low : GraphicsDetail.Medium,
    ortho: false,
    highlightTargetBalls: true,
    physicsGuidelines: true,

    controlsOpen: false,
    canvasEnabled: true,
    debugLights: false,
    debugBalls: false,
    debugBallPaths: false,
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
    pullToShoot,
    spinControlOpen,
    ...serializable
  } = settings;
  localStorage.setItem('pool:settings', JSON.stringify(serializable));
});
