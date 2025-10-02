import { Button } from '@mantine/core';
import { useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { params as staticParams } from '../../common/simulation/physics';
import { constrain } from '../../common/util';
import { gameStore } from '../game/store/game';
import { settings } from '../game/store/settings';
import './power-bar.scss';
import { useMouseInputs } from './use-mouse-inputs';

export const PowerBar = () => {
  const { cueForce } = useSnapshot(gameStore);
  const { controlMode, distanceBasedPower } = useSnapshot(settings);

  // todo: useSnapshot(params);
  const params = staticParams;

  const props = useMouseInputs(({ x }) => {
    gameStore.cueForce = params.cue.maxForce * x;
  }, []);

  useEffect(() => {
    const scrollListener = (event: WheelEvent) => {
      if (!event.shiftKey) return;
      const force =
        gameStore.cueForce / params.cue.maxForce - event.deltaY * 0.0002;
      gameStore.cueForce = params.cue.maxForce * constrain(force, 0, 1);
    };

    document.addEventListener('wheel', scrollListener, { passive: true });

    return () => {
      document.removeEventListener('wheel', scrollListener);
    };
  }, []);

  return (
    <>
      {controlMode === 'cursor' && (
        <Button
          variant={distanceBasedPower ? 'filled' : 'default'}
          onClick={() => (settings.distanceBasedPower = !distanceBasedPower)}
        >
          Auto
        </Button>
      )}
      <div className="power-bar">
        <div className="power-bar__click-area" {...props}>
          <div
            className="power-bar__current-power"
            style={{ width: `${(cueForce / params.cue.maxForce) * 100}%` }}
          />
          <span className="power-bar__power-num">{cueForce.toFixed(2)}m/s</span>
        </div>
      </div>
    </>
  );
};
