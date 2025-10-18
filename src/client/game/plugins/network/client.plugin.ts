import { createEventSystemFactory, createPlugin } from '@common/ecs/func';
import type { GameEvents } from '../../events';

const createEventSystem = createEventSystemFactory<GameEvents>();

const onSetupTable = createEventSystem('receive/setup-table', (ecs, data) => {
  ecs.emit('game/setup', data);
});

const onUpdateSystemState = createEventSystem(
  'receive/system-state',
  (ecs, data) => {}
);

const onUpdateParams = createEventSystem('receive/params', (ecs, params) => {});

export const networkClientPlugin = createPlugin<GameEvents>((ecs) => {
  ecs.addEventSystem(onSetupTable);
  ecs.addEventSystem(onUpdateSystemState);
  ecs.addEventSystem(onUpdateParams);

  return () => {
    ecs.removeEventSystem(onSetupTable);
    ecs.removeEventSystem(onUpdateSystemState);
    ecs.removeEventSystem(onUpdateParams);
  };
});
