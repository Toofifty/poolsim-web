import { ECS, Plugin } from '@common/ecs';
import { GameOverSystem } from './game-over.system';
import { StateUpdateSystem } from './state-update.system';

export class GameplayPlugin extends Plugin {
  public install(ecs: ECS): void {
    ecs.addEventSystem(new StateUpdateSystem());
    ecs.addEventSystem(new GameOverSystem());
  }
}
