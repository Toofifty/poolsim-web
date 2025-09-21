import { Cue } from '../game/objects/cue';
import './power-bar.scss';
import { useSnapshot } from 'valtio';
import { gameStore } from '../game/store/game';
import { useMouseInputs } from './use-mouse-inputs';

export const PowerBar = () => {
  const { cueForce } = useSnapshot(gameStore);

  const props = useMouseInputs(({ x }) => {
    gameStore.cueForce = Cue.MAX_FORCE * x;
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
