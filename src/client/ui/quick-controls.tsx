import { Button } from '@mantine/core';
import {
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
import { useGameEvent } from './use-game-event';
import { useIsMobile } from './use-media-query';

export const QuickControls = () => {
  const ecs = useGameContext().ecs;
  const isMobile = useIsMobile();
  const { enableZoomPan } = useSnapshot(settings);
  const [resettingCamera, setResettingCamera] = useState(false);

  const [lockCue, setLockCue] = useState(false);

  useGameEvent('game/cue-update', (cue) => setLockCue(cue.locked), []);

  const onShoot = () => {
    Game.instance.controller.uiShoot();
  };

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
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
    <div className="quick-controls">
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
        variant={resettingCamera ? 'filled' : 'default'}
        onClick={() => Game.resetCamera()}
        rightSection={isMobile ? <IconRefreshDot size={16} /> : <kbd>R</kbd>}
      >
        Reset camera
      </Button>
    </div>
  );
};
