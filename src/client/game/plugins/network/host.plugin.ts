import { createEventSystemFactory, createPlugin } from '@common/ecs/func';
import type { GameEvents } from '../../events';

const createEventSystem = createEventSystemFactory<GameEvents>();

const sendGameSetup = createEventSystem('game/setup', (ecs, data) => {
  ecs.emit('send/setup-table', data);
});

export const networkHostPlugin = createPlugin<GameEvents>(
  (ecs) => {
    ecs.addEventSystem(sendGameSetup);
  },
  (ecs) => {
    ecs.removeEventSystem(sendGameSetup);
  }
);
