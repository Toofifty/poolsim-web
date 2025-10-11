import { ECS, EventSystem } from '@common/ecs';
import type { GameEvents } from '../../events';
import { Cue } from './cue.component';

export class CueLockSystem extends EventSystem<'input/lock-cue', GameEvents> {
  public event = 'input/lock-cue' as const;

  public run(
    ecs: ECS<GameEvents, unknown>,
    data: GameEvents['input/lock-cue']
  ): void {
    const cue = ecs.query().resolveFirst(Cue);
    cue.locked = !cue.locked;
    ecs.emit('game/cue-update', cue);
  }
}
