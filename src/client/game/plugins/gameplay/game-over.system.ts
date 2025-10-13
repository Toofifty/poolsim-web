import { ECS, EventSystem } from '@common/ecs';
import { PlayState } from '../../controller/game-controller';
import type { GameEvents } from '../../events';
import { SystemState } from '../../resources/system-state';

export class GameOverSystem extends EventSystem<'game/game-over', GameEvents> {
  public event = 'game/game-over' as const;

  public run(
    ecs: ECS<GameEvents, unknown>,
    data: GameEvents['game/game-over']
  ): void {
    const system = ecs.resource(SystemState);
    system.playState = PlayState.GameOver;
  }
}
