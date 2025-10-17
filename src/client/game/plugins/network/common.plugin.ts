import { createEventSystemFactory, createPlugin } from '@common/ecs/func';
import type { GameEvents } from '../../events';

const createEventSystem = createEventSystemFactory<GameEvents>();

const onPickupBall = createEventSystem(
  'receive/pickup-ball',
  (ecs, { id }) => {}
);

const onMoveBall = createEventSystem(
  'receive/move-ball',
  (ecs, { id, position }) => {}
);

const onPlaceBall = createEventSystem(
  'receive/place-ball',
  (ecs, { id, position }) => {}
);

const onMoveCue = createEventSystem('receive/move-cue', (ecs, cue) => {});

const onShoot = createEventSystem('receive/shoot', (ecs, cue) => {});

export const networkCommonPlugin = createPlugin<GameEvents>(
  (ecs) => {
    ecs.addEventSystem(onPickupBall);
    ecs.addEventSystem(onMoveBall);
    ecs.addEventSystem(onPlaceBall);
    ecs.addEventSystem(onMoveCue);
    ecs.addEventSystem(onShoot);
  },
  (ecs) => {
    ecs.removeEventSystem(onPickupBall);
    ecs.removeEventSystem(onMoveBall);
    ecs.removeEventSystem(onPlaceBall);
    ecs.removeEventSystem(onMoveCue);
    ecs.removeEventSystem(onShoot);
  }
);
