import { Button, Group, Stack } from '@mantine/core';
import {
  IconArrowLeft,
  IconArrowRight,
  IconArrowsMove,
  IconLockShare,
  IconPlayerPlay,
  IconRefreshDot,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useSnapshot } from 'valtio';
import { Game } from '../game/game';
import { settings } from '../game/store/settings';
import { useGameContext } from '../util/game-provider';
import './quick-controls.scss';
import { Surface } from './surface';
import { useGameBinding } from './use-game-binding';
import { useIsMobile } from './use-media-query';

export const QuickControls = () => {
  const ecs = useGameContext().ecs;
  const isMobile = useIsMobile();
  const { enableZoomPan } = useSnapshot(settings);
  const [resettingCamera, setResettingCamera] = useState(false);

  const lockCue = useGameBinding('game/cue-update', (cue) => cue.locked, false);
  const cueFocused = useGameBinding('game/focus-cue', (v) => v, false);

  const onShoot = () => {
    ecs.emit('game/start-shooting', {});
  };

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      // visual feedback - actual keyboard listeners are in game.ts

      if (event.key === 'r') {
        setResettingCamera(true);
        setTimeout(() => {
          setResettingCamera(false);
        }, 100);
      }
    };

    document.addEventListener('keyup', listener);

    return () => {
      document.removeEventListener('keyup', listener);
    };
  });

  return (
    <Stack align="center" justify="end">
      {cueFocused && (
        <Group>
          <IconArrowLeft />
          <Surface>
            <div className="group lower">
              <span>
                {isMobile ? (
                  'Drag'
                ) : (
                  <>
                    Drag <kbd>RMB</kbd>
                  </>
                )}{' '}
                to aim
              </span>
            </div>
          </Surface>
          <IconArrowRight />
        </Group>
      )}
      <Group wrap="nowrap" gap="xs">
        {isMobile && (
          <>
            <Button
              className="surface button"
              size="40"
              onClick={onShoot}
              rightSection={<IconPlayerPlay size={16} />}
            >
              Shoot
            </Button>
            <Button
              className="surface button"
              size="40"
              variant={enableZoomPan ? 'filled' : 'default'}
              onClick={() => (settings.enableZoomPan = !enableZoomPan)}
              rightSection={<IconArrowsMove size={16} />}
            >
              Rotate camera
            </Button>
          </>
        )}
        {!isMobile && (
          <Button
            className="surface button"
            size="40"
            variant={lockCue ? 'filled' : 'default'}
            onClick={() => ecs.emit('input/lock-cue', {})}
            rightSection={isMobile ? <IconLockShare size={16} /> : <kbd>L</kbd>}
          >
            {lockCue ? 'Cue locked' : <>Lock cue</>}
          </Button>
        )}
        <Button
          className="surface button"
          size="40"
          disabled={cueFocused}
          variant={resettingCamera ? 'filled' : 'default'}
          onClick={() => Game.resetCamera()}
          rightSection={isMobile ? <IconRefreshDot size={16} /> : <kbd>R</kbd>}
        >
          Reset camera
        </Button>
        <Button
          className="surface button"
          size="40"
          variant={cueFocused ? 'filled' : 'default'}
          onClick={() => ecs.emit('input/focus-cue', undefined)}
          rightSection={isMobile ? <IconRefreshDot size={16} /> : <kbd>F</kbd>}
        >
          Focus
        </Button>
      </Group>
    </Stack>
  );
};
