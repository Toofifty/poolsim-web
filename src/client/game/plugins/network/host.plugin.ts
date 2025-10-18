import {
  createEventSystemFactory,
  createPlugin,
  createStartupSystem,
} from '@common/ecs/func';
import { Ruleset } from '@common/simulation/physics';
import type { GameEvents } from '../../events';
import { SystemState } from '../../resources/system-state';
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

const sendPhysicsSync = createEventSystem('game/settled', (ecs, data) => {
  const balls = ecs.query().resolveAll(Physics);
  ecs.emit('send/physics-sync', { balls });
});

const startGame = createStartupSystem<GameEvents>((ecs) => {
  // todo: use ruleset from params
  ecs.emit('input/setup-game', { ruleset: Ruleset._8Ball });
});

export const networkHostPlugin = createPlugin<GameEvents>((ecs) => {
  ecs.addEventSystem(sendGameSetup);
  ecs.addEventSystem(sendPhysicsSync);
  ecs.addStartupSystem(startGame);

  return () => {
    ecs.removeEventSystem(sendGameSetup);
    ecs.removeEventSystem(sendPhysicsSync);
  };
});
