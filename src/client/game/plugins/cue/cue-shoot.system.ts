import { ECS, EventSystem } from '@common/ecs';
import { Shot } from '@common/simulation/shot';
import { assertExists } from '@common/util';
import type { GameEvents } from '../../events';
import { Cue } from './cue.component';

export class CueShootSystem extends EventSystem<
  'input/mouse-pressed',
  GameEvents
> {
  public event = 'input/mouse-pressed' as const;

  public run(
    ecs: ECS<GameEvents, unknown>,
    data: GameEvents['input/mouse-pressed']
  ): void {
    // todo: check game state
    if (data.button !== 0) return;

    const cueEntity = ecs.query().firstWith(Cue);
    assertExists(cueEntity, 'No cue found when shooting');
    const [cue] = ecs.get(cueEntity, Cue);
    assertExists(cue.targetEntity, 'No target ball found when shooting');

    ecs.emit('game/shoot', {
      targetEntity: cue.targetEntity,
      shot: Shot.from(cue),
    });
  }
}
