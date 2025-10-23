import { createEventSystemFactory, createPlugin } from '@common/ecs/func';
import { quat, vec } from '@common/math';
import { assert, assertExists } from '@common/util';
import type { GameEvents } from '../../events';
import { SystemState } from '../../resources/system-state';
import { Physics } from '../physics/physics.component';

const createEventSystem = createEventSystemFactory<GameEvents>();

const onSetupTable = createEventSystem('receive/setup-table', (ecs, data) => {
  ecs.emit('game/setup', data);
});

const onPhysicsSync = createEventSystem(
  'receive/physics-sync',
  (ecs, { balls }) => {
    const localBalls = ecs.query().resolveAll(Physics);

    assert(
      localBalls.length === balls.length,
      `Physics sync: ball length mismatch - have ${localBalls.length}, got ${balls.length} updates`
    );

    balls.forEach((ball) => {
      const local = localBalls.find((l) => l.id === ball.id);
      assertExists(local, `Physics sync: could not find ball ${ball.id}`);
      local.R = ball.R;
      vec.mcopy(local.r, ball.r);
      vec.mcopy(local.v, ball.v);
      vec.mcopy(local.w, ball.w);
      quat.mcopy(local.orientation, ball.orientation);
      local.state = ball.state;
      local.pocketId = ball.pocketId;
    });
  }
);

const onUpdateSystemState = createEventSystem(
  'receive/system-state',
  (ecs, data) => {
    const system = ecs.resource(SystemState);
    system.currentPlayer = 1;

    system.gameState = data.gameState;
    system.playerCount = data.playerCount;
    system.eightBallState = data.eightBallState;
    system.isBreak = data.isBreak;
    system.turnIndex = data.turnIndex;
  }
);

const onUpdateParams = createEventSystem('receive/params', (ecs, params) => {});

export const networkClientPlugin = createPlugin<GameEvents>((ecs) => {
  ecs.addEventSystem(onSetupTable);
  ecs.addEventSystem(onPhysicsSync);
  ecs.addEventSystem(onUpdateSystemState);
  ecs.addEventSystem(onUpdateParams);

  return () => {
    ecs.removeEventSystem(onSetupTable);
    ecs.removeEventSystem(onPhysicsSync);
    ecs.removeEventSystem(onUpdateSystemState);
    ecs.removeEventSystem(onUpdateParams);
  };
});
