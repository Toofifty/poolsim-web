import cx from 'classnames';
import { useEffect } from 'react';
import { defaultParams } from '../../common/simulation/physics';
import { constrain } from '../../common/util';
import { useGameContext } from '../util/game-provider';
import './power-bar.scss';
import { useGameBinding } from './use-game-binding';
import { useMouseInputs } from './use-mouse-inputs';

const labels = [
  { at: 0, label: 'Soft' },
  { at: 0.45, label: 'Slow' },
  { at: 0.89, label: 'Medium' },
  { at: 1.9, label: 'Fast' },
  { at: 3.2, label: 'Power shot', color: 'hsla(109, 100%, 36%, 1.00)' },
  { at: 5, label: 'Break', color: 'hsla(41, 100%, 36%, 1.00)' },
  { at: 11, label: 'Powerful break', color: 'hsla(22, 100%, 48%, 1.00)' },
  { at: 16, label: 'Expert break', color: 'hsla(0, 100%, 50%, 1.00)' },
];

export const PowerBar = () => {
  const ecs = useGameContext().ecs;
  const maxForce = defaultParams.cue.maxForce;

  const cueForce = useGameBinding('game/cue-update', (cue) => cue.force, 0);

  const props = useMouseInputs(
    ({ x }) =>
      ecs.emit('input/cue-update', {
        force: x * maxForce,
      }),
    [ecs]
  );

  useEffect(() => {
    const scrollListener = (event: WheelEvent) => {
      if (!event.shiftKey) return;
      const force = cueForce / maxForce - event.deltaY * 0.0002;

      ecs.emit('input/cue-update', {
        force: constrain(force, 0, 1) * maxForce,
      });
    };

    document.addEventListener('wheel', scrollListener, { passive: true });

    return () => {
      document.removeEventListener('wheel', scrollListener);
    };
  }, [ecs, cueForce]);

  const filteredLabels = labels.filter(({ at }) => at < maxForce);
  const currentPowerLabel = labels.filter(({ at }) => at <= cueForce).at(-1);

  return (
    <div className="power-bar">
      <div className="power-bar__click-area" {...props}>
        <div
          className="power-bar__current-power"
          style={{
            width: `${(cueForce / maxForce) * 100}%`,
            ...(currentPowerLabel?.color
              ? {
                  ['--color' as any]: currentPowerLabel.color,
                }
              : {}),
          }}
        >
          {currentPowerLabel && (
            <div className="power-bar__current-power-label">
              {currentPowerLabel.label}
            </div>
          )}
        </div>
        {filteredLabels.map(({ at, label }) => (
          <span
            key={label}
            className={cx(
              'power-bar__power-label',
              at === 0 && 'power-bar__power-label--soft',
              at < cueForce && 'power-bar__power-label--hidden'
            )}
            style={{ left: `${(100 * at) / maxForce}%` }}
          >
            {label}
          </span>
        ))}
        <span className="power-bar__power-num">{cueForce.toFixed(2)}m/s</span>
      </div>
    </div>
  );
};
