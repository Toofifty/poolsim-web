import { createPlugin } from '@common/ecs/func';
import type { GameEvents } from '../../events';
import { PhysicsSystem } from './physics.system';

export const physicsPlugin = createPlugin<GameEvents>((ecs) => {
  const physicsSystem = ecs.addFixedUpdateSystem(new PhysicsSystem());

  return () => {
    ecs.removeSystem(physicsSystem);
  };
});
