import { createPlugin } from '@common/ecs/func';
import type { GameEvents } from '../../events';
import { AccumulatedResult } from './accumulated-result.resource';
import { PhysicsSystem } from './physics.system';

export const physicsPlugin = createPlugin<GameEvents>((ecs) => {
  const accumulatedResult = ecs.addResource(new AccumulatedResult());
  const physicsSystem = ecs.addFixedUpdateSystem(new PhysicsSystem());

  return () => {
    ecs.removeResource(accumulatedResult);
    ecs.removeSystem(physicsSystem);
  };
});
