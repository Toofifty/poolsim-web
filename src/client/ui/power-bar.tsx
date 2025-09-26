import { useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { constrain } from '../../common/util';
import { Cue } from '../game/objects/cue';
import { gameStore } from '../game/store/game';
import './power-bar.scss';
import { useMouseInputs } from './use-mouse-inputs';

export const PowerBar = () => {
  const { cueForce } = useSnapshot(gameStore);

  const props = useMouseInputs(({ x }) => {
    gameStore.cueForce = Cue.MAX_FORCE * x;
  }, []);

  useEffect(() => {
    const scrollListener = (event: WheelEvent) => {
      if (!event.shiftKey) return;
      const force = gameStore.cueForce / Cue.MAX_FORCE - event.deltaY * 0.0002;
      gameStore.cueForce = Cue.MAX_FORCE * constrain(force, 0, 1);
    };

    document.addEventListener('wheel', scrollListener, { passive: true });

    return () => {
      document.removeEventListener('wheel', scrollListener);
    };
  }, []);

  return (
    <div className="power-bar">
      <div className="power-bar__click-area" {...props}>
        <div
          className="power-bar__current-power"
          style={{ width: `${(cueForce / Cue.MAX_FORCE) * 100}%` }}
        />
        <span className="power-bar__power-num">{cueForce.toFixed(2)}m/s</span>
      </div>
    </div>
  );
};
