import { useEffect } from 'react';
import { defaultParams } from '../../common/simulation/physics';
import { constrain } from '../../common/util';
import { useGameContext } from '../util/game-provider';
import './power-bar.scss';
import { useGameBinding } from './use-game-binding';
import { useMouseInputs } from './use-mouse-inputs';

export const PowerBar = () => {
  const ecs = useGameContext().ecs;

  const cueForce = useGameBinding('game/cue-update', (cue) => cue.force, 0);

  const props = useMouseInputs(
    ({ x }) =>
      ecs.emit('input/cue-update', {
        force: x * defaultParams.cue.maxForce,
      }),
    [ecs]
  );

  useEffect(() => {
    const scrollListener = (event: WheelEvent) => {
      if (!event.shiftKey) return;
      const force =
        cueForce / defaultParams.cue.maxForce - event.deltaY * 0.0002;

      ecs.emit('input/cue-update', {
        force: constrain(force, 0, 1) * defaultParams.cue.maxForce,
      });
    };

    document.addEventListener('wheel', scrollListener, { passive: true });

    return () => {
      document.removeEventListener('wheel', scrollListener);
    };
  }, [ecs, cueForce]);

  return (
    <div className="power-bar">
      <div className="power-bar__click-area" {...props}>
        <div
          className="power-bar__current-power"
          style={{ width: `${(cueForce / defaultParams.cue.maxForce) * 100}%` }}
        />
        <span className="power-bar__power-num">{cueForce.toFixed(2)}m/s</span>
      </div>
    </div>
  );
};
