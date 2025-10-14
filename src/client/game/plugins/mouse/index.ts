import { ECS, Plugin } from '@common/ecs';
import type { GameEvents } from '../../events';
import type { Game } from '../../game';
import { MousePosition } from './mouse-position.resource';
import { MousePositionSystem } from './mouse-position.system';
import { MouseSetupSystem } from './mouse-setup.system';

export class MousePlugin extends Plugin {
  public install(ecs: ECS<GameEvents, Game>): void {
    ecs.addResource(MousePosition.create());
    ecs.addStartupSystem(new MouseSetupSystem());
    ecs.addEventSystem(new MousePositionSystem(ecs.game.camera));
  }
}
