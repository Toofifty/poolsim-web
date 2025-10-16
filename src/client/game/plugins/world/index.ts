import { ECS, Plugin } from '@common/ecs';
import type { GameEvents } from '../../events';
import { WorldSetupSystem } from './world-setup.system';

export class WorldPlugin extends Plugin {
  public install(ecs: ECS<GameEvents>): void {
    ecs.addStartupSystem(new WorldSetupSystem());
  }
}
