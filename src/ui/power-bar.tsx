import { useEffect, useState, type MouseEvent } from 'react';
import { Game } from '../game/game';
import { Cue } from '../game/objects/cue';
import './power-bar.scss';
import { Surface } from './surface';

export const PowerBar = () => {
  const [force, setForce] = useState(() => Game.instance.table.cue.force);

  useEffect(() => {
    Game.instance.table.cue.force = force;
  }, [force]);

  const onClick = (event: MouseEvent) => {
    const area = (event.target as HTMLElement).getBoundingClientRect();
    setForce((Cue.MAX_FORCE * (event.clientX - area.left)) / area.width);
  };

  return (
    <Surface className="power-bar">
      <div className="power-bar__click-area" onClick={onClick}>
        <div
          className="power-bar__current-power"
          style={{ width: `${(force / Cue.MAX_FORCE) * 100}%` }}
        />
        <span className="power-bar__power-num">
          {(force / 100).toFixed(2)}m/s
        </span>
      </div>
    </Surface>
  );
};
