import { ECS, StartupSystem } from '@common/ecs';
import { subscribe } from 'valtio';
import type { DeepPathOf } from '../../util/types';
import type { GameEvents } from '../events';
import { settings } from '../store/settings';

export class SettingsListenerSystem extends StartupSystem {
  public run(ecs: ECS<GameEvents>): void {
    subscribe(settings, (events) =>
      events.forEach(([op, segments]) => {
        if (op !== 'set') return;
        ecs.emit('game/setting-update', {
          mutated: segments.map((_, i, parts) =>
            parts.slice(0, i + 1).join('.')
          ) as DeepPathOf<typeof settings>[],
        });
      })
    );
  }
}
