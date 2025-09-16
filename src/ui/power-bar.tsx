import { useEffect, useState, type MouseEvent } from 'react';
import { Game } from '../game/game';
import { Cue } from '../game/objects/cue';
import './power-bar.scss';
import { useSnapshot } from 'valtio';
import { gameStore } from '../game/store/game';

export const PowerBar = () => {
  const { cueForce } = useSnapshot(gameStore);

  const setForce = (force: number) => (gameStore.cueForce = force);

  const onClick = (event: MouseEvent) => {
    const area = (event.target as HTMLElement).getBoundingClientRect();
    setForce((Cue.MAX_FORCE * (event.clientX - area.left)) / area.width);
  };

  return (
    <div className="power-bar">
      <div className="power-bar__click-area" onClick={onClick}>
        <div
          className="power-bar__current-power"
          style={{ width: `${(cueForce / Cue.MAX_FORCE) * 100}%` }}
        />
        <span className="power-bar__power-num">{cueForce.toFixed(2)}m/s</span>
      </div>
    </div>
  );
};
