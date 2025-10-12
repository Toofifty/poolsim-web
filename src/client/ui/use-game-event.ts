import { EightBallState } from '@common/simulation/table-state';
import { useCallback, useEffect } from 'react';
import type { GameEvents } from '../game/events';
import { useGameContext } from '../util/game-provider';

// todo: put somewhere better
export const getPlayer8BallState = (
  eightballState: EightBallState,
  isPlayer1: boolean
) => {
  if (eightballState === EightBallState.Open) return 'open';
  return isPlayer1 === (eightballState === EightBallState.Player1Solids)
    ? 'solids'
    : 'stripes';
};

export const useGameEvent = <T extends keyof GameEvents>(
  event: T,
  callback: (data: GameEvents[T]) => void,
  deps: unknown[] = []
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
