import { ECS, EventSystem } from '@common/ecs';
import type { GameEvents } from '../events';
import { SystemState } from '../resources/system-state';

export class ExternalParamChangeSystem extends EventSystem<
  'input/param-change',
  GameEvents
> {
  public event = 'input/param-change' as const;

  public run(
    ecs: ECS<GameEvents, unknown>,
    data: GameEvents['input/param-change']
  ): void {
    const system = ecs.resource(SystemState);
    system.setParam(data.key, data.value);
  }
}
