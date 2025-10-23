import { ECS, EventSystem } from '@common/ecs';
import type { GameEvents } from '../events';

export abstract class SettingUpdateSystem extends EventSystem<
  'game/setting-update',
  GameEvents
> {
  public event = 'game/setting-update' as const;
  public abstract test: (
    mutated: GameEvents['game/setting-update']['mutated']
  ) => boolean;

  public run(
    ecs: ECS<GameEvents, unknown>,
    data: GameEvents['game/setting-update']
  ): void {
    if (this.test(data.mutated)) {
      this.onChange(ecs);
    }
  }

  public abstract onChange(ecs: ECS<GameEvents, unknown>): void;
}
