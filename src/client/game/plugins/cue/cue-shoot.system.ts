import { createEventSystemFactory } from '@common/ecs/func';
import { defaultParams } from '@common/simulation/physics';
import { Shot } from '@common/simulation/shot';
import { assertExists } from '@common/util';
import { dlerp } from '../../dlerp';
import type { GameEvents } from '../../events';
import { SystemState } from '../../resources/system-state';
import { settings } from '../../store/settings';
import { InHand } from '../gameplay/in-hand.component';
import { Cue } from './cue.component';

const createEventSystem = createEventSystemFactory<GameEvents>();

export const startCueShootSystem = createEventSystem(
  'input/mouse-pressed',
  async (ecs, data) => {
    if (data.button !== 0 || settings.controlMode === 'touch') return;

    const system = ecs.resource(SystemState);
    if (!system.isShootable || !system.isActivePlayer) return;

    const ballInHandEntity = ecs.query().has(InHand).findOne();
    if (ballInHandEntity !== undefined) return;

    const cueEntity = ecs.query().firstWith(Cue);
    assertExists(cueEntity, 'No cue found when shooting');
    const [cue] = ecs.get(cueEntity, Cue);
    assertExists(cue.targetId, 'No target ball found when shooting');

    ecs.emit('game/start-shooting', {});
  }
);

export const animateCueShootSystem = createEventSystem(
  'game/start-shooting',
  async (ecs) => {
    const cueEntity = ecs.query().firstWith(Cue);
    assertExists(cueEntity, 'No cue found when shooting');
    const [cue] = ecs.get(cueEntity, Cue);
    assertExists(cue.targetId, 'No target ball found when shooting');

    cue.shooting = true;

    // draw back
    await dlerp(
      (v) => (cue.drawback = v),
      cue.drawback,
      cue.force / 4,
      defaultParams.cue.pullBackTime
    );

    // shoot
    await dlerp(
      (v) => (cue.drawback = v),
      cue.drawback,
      -defaultParams.ball.radius * 0.5,
      defaultParams.cue.shootTime
    );

    ecs.emit('game/shoot', {
      id: cue.targetId,
      shot: Shot.from(cue),
    });

    // retract
    await dlerp(
      (v) => (cue.drawback = v),
      cue.drawback,
      0,
      defaultParams.cue.pullBackTime
    );
    cue.shooting = false;
  }
);
