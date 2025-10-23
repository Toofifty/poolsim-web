import { cloneParams, defaultParams } from '@common/simulation/physics';
import { SystemState } from '../game/resources/system-state';
import { useGameContext } from '../util/game-provider';
import { useGameBinding } from './use-game-binding';

export const useGameParams = () => {
  const ecs = useGameContext().ecs;

  return useGameBinding(
    'game/param-update',
    () => cloneParams(ecs.resource(SystemState).params),
    defaultParams
  );
};
