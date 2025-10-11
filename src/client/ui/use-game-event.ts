import { useCallback, useEffect } from 'react';
import type { GameEvents } from '../game/events';
import { useGameContext } from '../util/game-provider';

export const useGameEvent = <T extends keyof GameEvents>(
  event: T,
  callback: (data: GameEvents[T]) => void,
  deps: unknown[]
) => {
  const ecs = useGameContext().ecs;

  const memoCallback = useCallback(callback as Function, deps) as (
    data: GameEvents[T]
  ) => void;

  useEffect(() => {
    ecs.addExternalListener(event, memoCallback);

    return () => {
      ecs.removeExternalListener(event, memoCallback);
    };
  }, [ecs, memoCallback]);
};
