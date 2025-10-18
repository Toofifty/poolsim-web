import {
  createEventSystemFactory,
  createPlugin,
  createStartupSystem,
} from '@common/ecs/func';
import { Ruleset } from '@common/simulation/physics';
import type { GameEvents } from '../../events';

const createEventSystem = createEventSystemFactory<GameEvents>();

const sendGameSetup = createEventSystem('game/setup', (ecs, data) => {
  ecs.emit('send/setup-table', data);
});

const startGame = createStartupSystem<GameEvents>((ecs) => {
  // todo: use ruleset from params
  ecs.emit('input/setup-game', { ruleset: Ruleset._8Ball });
});

export const networkHostPlugin = createPlugin<GameEvents>((ecs) => {
  ecs.addEventSystem(sendGameSetup);
  ecs.addStartupSystem(startGame);

  return () => {
    ecs.removeEventSystem(sendGameSetup);
  };
});
