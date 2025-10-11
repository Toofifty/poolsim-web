import { ECS, EventSystem } from '@common/ecs';
import type { GameEvents } from '../../events';
import { Cue } from './cue.component';

export class CueUIUpdateSystem extends EventSystem<
  'input/cue-update',
  GameEvents
> {
  public event = 'input/cue-update' as const;
  public run(
    ecs: ECS<GameEvents, unknown>,
    data: GameEvents['input/cue-update']
  ): void {
    const cue = ecs.query().resolveFirst(Cue);

    if (data.force !== undefined) cue.force = data.force;
    if (data.top !== undefined) cue.top = data.top;
    if (data.side !== undefined) cue.side = data.side;
    if (data.lift !== undefined) cue.lift = data.lift;

    ecs.emit('game/cue-update', cue);
  }
}
