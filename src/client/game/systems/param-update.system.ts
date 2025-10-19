import { ECS, EventSystem } from '@common/ecs';
import { createEventSystemFactory } from '@common/ecs/func';
import type { Params } from '@common/simulation/physics';
import type { GameEvents } from '../events';
import { SystemState } from '../resources/system-state';

const createEventSystem = createEventSystemFactory<GameEvents>();

export const createParamUpdateSystem = (
  predicate: (mutated: GameEvents['game/param-update']['mutated']) => boolean,
  system: (ecs: ECS<GameEvents>, params: Params) => void
) =>
  createEventSystem('game/param-update', (ecs, data) => {
    if (predicate(data.mutated)) {
      system(ecs, ecs.resource(SystemState).params);
    }
  });

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
