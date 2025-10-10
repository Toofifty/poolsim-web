import { ECS, Plugin } from '@common/ecs';
import { PhysicsSystem } from './physics.system';

export class PhysicsPlugin extends Plugin {
  public install(ecs: ECS): void {
    ecs.addSystem(new PhysicsSystem());
  }
}
