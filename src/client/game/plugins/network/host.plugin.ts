import {
  createEventSystemFactory,
  createPlugin,
  createStartupSystem,
  createSystem,
} from '@common/ecs/func';
import { defaultParams, Ruleset } from '@common/simulation/physics';
import type { GameEvents } from '../../events';
import { GameState, SystemState } from '../../resources/system-state';
import { throttle } from '../../util/throttle';
import { Physics } from '../physics/physics.component';

const createEventSystem = createEventSystemFactory<GameEvents>();

const sendGameSetup = createEventSystem('game/setup', (ecs, data) => {
  const system = ecs.resource(SystemState);
  system.currentPlayer = 0;

  system.playerCount = 2;

  ecs.emit('send/system-state', {
    gameState: system.gameState,
    playerCount: system.playerCount,
    eightBallState: system.eightBallState,
    isBreak: system.isBreak,
    turnIndex: system.turnIndex,
  });
  ecs.emit('send/setup-table', data);
});

const sendPhysicsSync = createSystem([], {
  runAll: throttle((ecs, data) => {
    const system = ecs.resource(SystemState);
    if (system.gameState !== GameState.Playing) return;

    const balls = ecs.query().resolveAll(Physics);
    ecs.emit('send/physics-sync', { balls });
  }, defaultParams.network.throttle),
});

const startGame = createStartupSystem<GameEvents>((ecs) => {
  // todo: use ruleset from params
  ecs.emit('input/setup-game', { ruleset: Ruleset._8Ball });
});

export const networkHostPlugin = createPlugin<GameEvents>((ecs) => {
  ecs.addEventSystem(sendGameSetup);
  ecs.addSystem(sendPhysicsSync);
  ecs.addStartupSystem(startGame);

  return () => {
    ecs.removeEventSystem(sendGameSetup);
    ecs.removeSystem(sendPhysicsSync);
  };
});
