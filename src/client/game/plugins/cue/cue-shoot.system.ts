import { ECS, EventSystem } from '@common/ecs';
import { defaultParams } from '@common/simulation/physics';
import { Shot } from '@common/simulation/shot';
import { assertExists } from '@common/util';
import { dlerp } from '../../dlerp';
import type { GameEvents } from '../../events';
import { GameState, SystemState } from '../../resources/system-state';
import { Cue } from './cue.component';

export class CueShootSystem extends EventSystem<
  'input/mouse-pressed',
  GameEvents
> {
  public event = 'input/mouse-pressed' as const;

  public async run(
    ecs: ECS<GameEvents, unknown>,
    data: GameEvents['input/mouse-pressed']
  ): Promise<void> {
    const systemState = ecs.resource(SystemState);
    if (systemState.gameState !== GameState.Shooting) return;
    if (data.button !== 0) return;

    const cueEntity = ecs.query().firstWith(Cue);
    assertExists(cueEntity, 'No cue found when shooting');
    const [cue] = ecs.get(cueEntity, Cue);
    assertExists(cue.targetEntity, 'No target ball found when shooting');

    ecs.emit('game/start-shooting', {});
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
      targetEntity: cue.targetEntity,
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
}
