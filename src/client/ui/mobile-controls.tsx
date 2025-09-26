import { IconArrowsMove, IconPlayerPlay } from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import { Game } from '../game/game';
import { settings } from '../game/store/settings';
import { Button } from './button';
import './mobile-controls.scss';
import { useIsMobile } from './use-media-query';

export const MobileControls = () => {
  const isMobile = useIsMobile();
  const { enableZoomPan } = useSnapshot(settings);

  const onShoot = () => {
    Game.manager.shoot();
  };

  //   if (!isMobile) {
  //     return null;
  //   }

  return (
    <div className="mobile-controls">
      <Button surface circle onClick={onShoot}>
        <IconPlayerPlay size={16} />
      </Button>
      <Button
        surface
        circle
        active={enableZoomPan}
        onClick={() => (settings.enableZoomPan = !enableZoomPan)}
      >
        <IconArrowsMove size={16} />
      </Button>
    </div>
  );
};
