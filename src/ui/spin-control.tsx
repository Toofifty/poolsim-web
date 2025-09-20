import { Surface } from './surface';
import './spin-control.scss';
import { Button } from './button';
import {
  IconArrowsHorizontal,
  IconArrowsVertical,
  IconRefresh,
} from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import { gameStore } from '../game/store/game';
import { useMemo, useState, type MouseEvent } from 'react';

export const SpinControl = () => {
  const { cueSpinX, cueSpinY } = useSnapshot(gameStore);

  const [lockTopSpin, setLockTopSpin] = useState(false);
  const [lockSideSpin, setLockSideSpin] = useState(false);

  const [clickArea, setClickArea] = useState<HTMLDivElement | null>(null);

  const [width, height] = useMemo(() => {
    if (clickArea) {
      const rect = clickArea.getBoundingClientRect();
      return [rect.width, rect.height];
    }
    return [0, 0];
  }, [clickArea]);

  const onClick = (event: MouseEvent) => {
    const area = (event.target as HTMLElement).getBoundingClientRect();
    const x = (event.clientX - area.left - area.width / 2) / area.width;
    const y = (event.clientY - area.top - area.height / 2) / area.height;
    if (!lockSideSpin) gameStore.cueSpinX = x * 1;
    if (!lockTopSpin) gameStore.cueSpinY = y * 1;
  };

  return (
    <Surface className="spin-control">
      <div className="spin-control__buttons">
        <Button
          className="spin-control__button"
          active={!lockTopSpin}
          onClick={() => setLockTopSpin((v) => !v)}
        >
          <IconArrowsVertical size={16} />
        </Button>
        <Button
          className="spin-control__button"
          active={!lockSideSpin}
          onClick={() => setLockSideSpin((v) => !v)}
        >
          <IconArrowsHorizontal size={16} />
        </Button>
        <Button
          className="spin-control__button"
          onClick={() => {
            gameStore.cueSpinX = 0;
            gameStore.cueSpinY = 0;
          }}
        >
          <IconRefresh size={16} />
        </Button>
      </div>
      <div ref={setClickArea} className="spin-control__ball-area">
        <div className="spin-control__ball" onClick={onClick} />
        <div
          className="spin-control__point"
          style={{
            transform: `translate(${cueSpinX * width}px, ${
              cueSpinY * height
            }px)`,
          }}
        />
      </div>
    </Surface>
  );
};
