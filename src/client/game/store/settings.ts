import { proxy, subscribe } from 'valtio';
import { AimAssistMode } from '../../../common/simulation/physics';
import { getIsMobile } from '../../ui/use-media-query';

export enum Players {
  PlayerVsPlayer,
  PlayerVsAI,
  AIVsAI,
}

const readFromStorage = <T>(def: T): T => {
  return JSON.parse(localStorage.getItem('pool:settings') ?? 'null') || def;
};

export const settings = proxy({
  // not persisted
  players: Players.PlayerVsPlayer,
  enableZoomPan: typeof window !== 'undefined' && !getIsMobile(),
  preferencesOpen: false,
  pauseSimulation: false,
  lockCue: false,

  ...readFromStorage({
    aimAssistMode: AimAssistMode.Off,

    highDetail: false,
    ortho: false,
    highlightTargetBalls: true,
    distanceBasedPower: true,

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
    pauseSimulation,
    lockCue,
    ...serializable
  } = settings;
  localStorage.setItem('pool:settings', JSON.stringify(serializable));
});
