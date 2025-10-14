import { ECS, EventSystem } from '@common/ecs';
import type { Params } from '@common/simulation/physics';
import type { GameEvents } from '../events';
import { SystemState } from '../resources/system-state';

export abstract class ParamUpdateSystem extends EventSystem<
  'game/param-update',
  GameEvents
> {
  public event = 'game/param-update' as const;
  public abstract test: (
    mutated: GameEvents['game/param-update']['mutated']
  ) => boolean;

  public run(
    ecs: ECS<GameEvents, unknown>,
    data: GameEvents['game/param-update']
  ): void {
    if (this.test(data.mutated)) {
      this.onChange(ecs, ecs.resource(SystemState).params);
    }
  }

  public abstract onChange(ecs: ECS<GameEvents, unknown>, params: Params): void;
}
