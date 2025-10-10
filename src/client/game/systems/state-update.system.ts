import { ECS, EventSystem } from '@common/ecs';
import { PlayState } from '../controller/game-controller';
import type { GameEvents } from '../events';
import { SystemState } from '../resources/system-state';

export class StateUpdateSystem extends EventSystem<'game/settled', GameEvents> {
  public event = 'game/settled' as const;
  public run(
    ecs: ECS<GameEvents, unknown>,
    data: GameEvents['game/settled']
  ): void {
    const system = ecs.resource(SystemState);

    if (system.playState === PlayState.PlayerInPlay) {
      system.playState = PlayState.PlayerShoot;
    }
  }
}
