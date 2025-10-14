import { ECS, Plugin } from '@common/ecs';
import type { GameEvents } from '../../events';
import { BallInHandHoverSystem } from './ball-in-hand-hover.system';
import { BallInHandInputSystem } from './ball-in-hand-input.system';
import { GameOverSystem } from './game-over.system';
import { MoveBallInHandSystem } from './move-ball-in-hand.system';
import { StateUpdateSystem } from './state-update.system';

export class GameplayPlugin extends Plugin {
  public install(ecs: ECS<GameEvents>): void {
    ecs.addEventSystem(new StateUpdateSystem());
    ecs.addEventSystem(new GameOverSystem());
    ecs.addEventSystem(new BallInHandInputSystem());
    ecs.addSystem(new BallInHandHoverSystem());
    ecs.addSystem(new MoveBallInHandSystem());
  }
}
