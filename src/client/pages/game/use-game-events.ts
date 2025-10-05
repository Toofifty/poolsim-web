import { notifications } from '@mantine/notifications';
import { useCallback, useEffect } from 'react';
import { EightBallState } from '../../../common/simulation/table-state';
import type {
  GameControllerEventMap,
  GameEventListener,
} from '../../game/controller/game-controller';
import type { Game } from '../../game/game';
import { getRuleSetName } from '../../util/enums';
import { useGameContext } from '../../util/game-provider';

export const getPlayer8BallState = (
  eightballState: EightBallState,
  isPlayer1: boolean
) => {
  if (eightballState === EightBallState.Open) return 'open';
  return isPlayer1 === (eightballState === EightBallState.Player1Solids)
    ? 'solids'
    : 'stripes';
};

export const useGameNotifications = (game: Game) => {
  const controller = game.controller;

  useEffect(() => {
    const onSetupTable: GameEventListener<'setup-table'> = ({ detail }) => {
      notifications.show({
        message: `Setup ${getRuleSetName(detail.ruleSet)} game`,
      });
    };

    const on8BallStateChange: GameEventListener<'8-ball-state-change'> = ({
      detail: { state, isPlayer1 },
    }) => {
      if (state === EightBallState.Open) return;

      notifications.show({
        message: `You are ${getPlayer8BallState(state, isPlayer1)}`,
      });
    };

    controller.addEventListener('setup-table', onSetupTable);
    controller.addEventListener('8-ball-state-change', on8BallStateChange);

    return () => {
      controller.removeEventListener('setup-table', onSetupTable);
      controller.removeEventListener('8-ball-state-change', on8BallStateChange);
    };
  }, [controller]);
};

export const useGameEvent = <T extends keyof GameControllerEventMap>(
  event: T,
  callback: GameEventListener<T>,
  deps: unknown[]
) => {
  const controller = useGameContext().controller;

  const memoCallback = useCallback(
    callback as Function,
    deps
  ) as GameEventListener<T>;

  useEffect(() => {
    controller.addEventListener(event, memoCallback);

    return () => {
      controller.removeEventListener(event, memoCallback);
    };
  }, [controller, memoCallback]);
};
