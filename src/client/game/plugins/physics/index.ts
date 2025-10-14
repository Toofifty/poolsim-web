import { ECS, Plugin } from '@common/ecs';
import type { GameEvents } from '../../events';
import { PhysicsSystem } from './physics.system';

export class PhysicsPlugin extends Plugin {
  public install(ecs: ECS<GameEvents>): void {
    ecs.addSystem(new PhysicsSystem());
  }
}
