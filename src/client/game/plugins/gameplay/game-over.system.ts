import { ECS, EventSystem } from '@common/ecs';
import type { GameEvents } from '../../events';
import { GameState, SystemState } from '../../resources/system-state';

export class GameOverSystem extends EventSystem<'game/game-over', GameEvents> {
  public event = 'game/game-over' as const;

  public run(
    ecs: ECS<GameEvents, unknown>,
    data: GameEvents['game/game-over']
  ): void {
    const system = ecs.resource(SystemState);
    system.gameState = GameState.GameOver;
  }
}
