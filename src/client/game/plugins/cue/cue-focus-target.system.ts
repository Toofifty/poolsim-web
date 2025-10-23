import { createEventSystemFactory } from '@common/ecs/func';
import { assertExists } from '@common/util';
import type { GameEvents } from '../../events';
import { SystemState } from '../../resources/system-state';
import { settings } from '../../store/settings';
import { Cue } from './cue.component';

const createEventSystem = createEventSystemFactory<GameEvents>();

/**
 * Drag cue in focus mode
 */
export const cueFocusTargetSystem = createEventSystem(
  'input/drag',
  (ecs, { button, delta }) => {
    const system = ecs.resource(SystemState);
    if (!system.cueFocused || !system.isShootable || !system.isActivePlayer) {
      return;
    }

    if (button === 1 && settings.controlMode === 'cursor') return;

    const cue = ecs.query().resolveFirst(Cue);
    assertExists(cue);
    if (cue.targetId === undefined || cue.shooting) {
      return;
    }

    cue.angle += delta[0] * -1;
    ecs.emit('game/cue-update', cue);
  }
);
