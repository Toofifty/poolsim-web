import { Button } from '@mantine/core';
import { IconArrowsMove, IconPlayerPlay } from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import { Game } from '../game/game';
import { settings } from '../game/store/settings';
import './mobile-controls.scss';
import { useIsMobile } from './use-media-query';

export const MobileControls = () => {
  const isMobile = useIsMobile();
  const { enableZoomPan } = useSnapshot(settings);

  const onShoot = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    Game.instance.controller.shoot();
  };

  //   if (!isMobile) {
  //     return null;
  //   }

  return (
    <div className="mobile-controls">
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
        variant={!enableZoomPan ? 'filled' : 'default'}
        onClick={() => (settings.enableZoomPan = !enableZoomPan)}
        rightSection={<IconArrowsMove size={16} />}
      >
        Lock orientation
      </Button>
    </div>
  );
};
