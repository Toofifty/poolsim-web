import { Ruleset } from '@common/simulation/physics';
import { EightBallState } from '@common/simulation/table-state';
import { notifications } from '@mantine/notifications';
import type { TurnFoul } from '../game/plugins/physics/simulation/result';
import { useGameBinding } from './use-game-binding';
import { useGameEvent } from './use-game-event';

const foulLabels: Record<Ruleset, Record<TurnFoul['foulReason'], string>> = {
  [Ruleset.Sandbox]: {
    'ball-ejected': 'object ball off table',
    scratched: 'scratch (cue ball potted)',
    'hit-invalid': 'wrong ball first',
    'hit-nothing': 'no ball contacted',
    'potted-invalid': '8 ball potted early',
    'no-cushion-contact': 'no cushion after contact',
  },
  [Ruleset.SandboxSequential]: {
    'ball-ejected': 'object ball off table',
    scratched: 'scratch (cue ball potted)',
    'hit-invalid': 'wrong ball first',
    'hit-nothing': 'no ball contacted',
    'potted-invalid': '8 ball potted early',
    'no-cushion-contact': 'no cushion after contact',
  },
  [Ruleset._8Ball]: {
    'ball-ejected': 'object ball off table',
    scratched: 'scratch (cue ball potted)',
    'hit-invalid': 'wrong ball first',
    'hit-nothing': 'no ball contacted',
    'potted-invalid': '8 ball potted early',
    'no-cushion-contact': 'no cushion after contact',
  },
  [Ruleset._9Ball]: {
    'ball-ejected': 'object ball off table',
    scratched: 'scratch (cue ball potted)',
    'hit-invalid': 'failed to strike lowest ball first',
    'hit-nothing': 'no ball contacted',
    'potted-invalid': 'illegal 9 ball pot',
    'no-cushion-contact': 'no cushion after contact',
  },
};

export const useGameNotifications = () => {
  const ruleset = useGameBinding(
    'game/setup',
    (data) => data.ruleset,
    Ruleset._8Ball
  );
  const currentPlayer = useGameBinding(
    'game/current-player-update',
    (p) => p,
    0
  );

  useGameEvent('game/foul', ({ foulReason }) => {
    notifications.show({ message: `Foul: ${foulLabels[ruleset][foulReason]}` });
  });

  useGameEvent('game/game-over', ({ winner }) => {
    if (winner === currentPlayer) {
      notifications.show({ message: 'You win!' });
    } else {
      notifications.show({ message: `Game over! Player ${winner + 1} wins!` });
    }

    if (currentPlayer === 0) {
      notifications.show({
        message: 'Press one of the buttons above to start a new game.',
      });
    }
  });

  useGameEvent(
    'game/8-ball-state-change',
    ({ state }) => {
      if (state === EightBallState.Open) return;

      if ((currentPlayer === 0) === (state === EightBallState.Player1Solids)) {
        notifications.show({ message: 'You are solids' });
      } else {
        notifications.show({ message: 'You are stripes' });
      }
    },
    [currentPlayer]
  );
};
