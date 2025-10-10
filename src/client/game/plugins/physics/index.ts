import { ECS, Plugin } from '@common/ecs';
import { MotionSystem } from './motion.system';

export class PhysicsPlugin extends Plugin {
  public install(ecs: ECS): void {
    ecs.addSystem(new MotionSystem());
  }
}
