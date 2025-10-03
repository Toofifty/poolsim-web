import { notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import { EightBallState } from '../../../common/simulation/table-state';
import type { GameEventListener } from '../../game/controller/game-controller';
import type { Game } from '../../game/game';
import { getEightBallStateName, getRuleSetName } from '../../util/enums';

export const useGameEvents = (game: Game) => {
  const controller = game.controller;

  useEffect(() => {
    const onSetupTable: GameEventListener<'setup-table'> = ({ detail }) => {
      notifications.show({
        message: `Setup ${getRuleSetName(detail.ruleSet)} game`,
      });
    };

    const on8BallStateChange: GameEventListener<'8-ball-state-change'> = ({
      detail,
    }) => {
      if (detail.state === EightBallState.Open) return;

      if (!detail.isPlayer1) {
        const opposite =
          detail.state === EightBallState.Player1Solids
            ? EightBallState.Player1Stripes
            : EightBallState.Player1Solids;
        notifications.show({
          message: `You are ${getEightBallStateName(opposite)}`,
        });
        return;
      }

      notifications.show({
        message: `You are ${getEightBallStateName(detail.state)}`,
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
