import { ActionIcon, Stack, Tooltip } from '@mantine/core';
import {
  IconArrowsHorizontal,
  IconArrowsVertical,
  IconChevronRight,
  IconRefresh,
  IconRotate360,
} from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { useSnapshot } from 'valtio';
import { gameStore } from '../game/store/game';
import './spin-control.scss';
import { Surface } from './surface';
import { useIsMobile } from './use-media-query';
import { useMouseInputs } from './use-mouse-inputs';

export const SpinControl = () => {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(!isMobile);
  const { cueSpinX, cueSpinY, cueLift } = useSnapshot(gameStore);

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

  const ballAreaProps = useMouseInputs(
    ({ x, y }) => {
      const rx = x - 0.5;
      const ry = y - 0.5;

      if (Math.sqrt(rx * rx + ry * ry) > 0.5) return;

      gameStore.cueSpinX = lockSideSpin ? 0 : rx;
      gameStore.cueSpinY = lockTopSpin ? 0 : ry;
    },
    [lockSideSpin, lockTopSpin]
  );

  const liftAreaProps = useMouseInputs(({ y }) => {
    if (y <= 0.01) y = 0.01;
    gameStore.cueLift = ((1 - y) * Math.PI) / 2;
  }, []);

  return (
    <div className="spin-control__container">
      <Tooltip
        // force rerender
        key={visible ? 'visible' : 'not-visible'}
        label={visible ? 'Close spin control' : 'Open spin control'}
      >
        <ActionIcon
          className="surface button icon"
          size="40"
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? (
            <IconChevronRight size={16} />
          ) : (
            <IconRotate360 size={16} />
          )}
        </ActionIcon>
      </Tooltip>
      {visible && (
        <Surface className="spin-control" py="md">
          <Stack justify="space-evenly">
            <ActionIcon
              variant={lockTopSpin ? 'default' : 'filled'}
              size="40"
              onClick={() => setLockTopSpin((v) => !v)}
            >
              <IconArrowsVertical size={16} />
            </ActionIcon>
            <ActionIcon
              variant={lockSideSpin ? 'default' : 'filled'}
              size="40"
              onClick={() => setLockSideSpin((v) => !v)}
            >
              <IconArrowsHorizontal size={16} />
            </ActionIcon>
            <ActionIcon
              size="40"
              onClick={() => {
                gameStore.cueSpinX = 0;
                gameStore.cueSpinY = 0;
                gameStore.cueLift = 0;
              }}
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Stack>
          <div ref={setClickArea} className="spin-control__ball-area">
            <div className="spin-control__ball" {...ballAreaProps} />
            <div
              className="spin-control__point"
              style={{
                transform: `translate(${cueSpinX * width}px, ${
                  cueSpinY * height
                }px)`,
              }}
            />
          </div>
          <div className="spin-control__lift-area" {...liftAreaProps}>
            <div className="spin-control__lift-container">
              <div className="spin-control__lift-mark">
                <span className="spin-control__lift-mark-line" />
                <span className="spin-control__lift-mark-value">90°</span>
              </div>
              <div
                className="spin-control__lift-mark"
                style={{ top: '16.666%' }}
              >
                <span className="spin-control__lift-mark-line subtle" />
              </div>
              <div
                className="spin-control__lift-mark"
                style={{ top: '33.333%' }}
              >
                <span className="spin-control__lift-mark-line subtle" />
              </div>
              <div className="spin-control__lift-mark" style={{ top: '50%' }}>
                <span className="spin-control__lift-mark-line" />
                <span className="spin-control__lift-mark-value">45°</span>
              </div>
              <div
                className="spin-control__lift-mark"
                style={{ top: '66.666%' }}
              >
                <span className="spin-control__lift-mark-line subtle" />
              </div>
              <div
                className="spin-control__lift-mark"
                style={{ top: '83.333%' }}
              >
                <span className="spin-control__lift-mark-line subtle" />
              </div>
              <div className="spin-control__lift-mark" style={{ bottom: 0 }}>
                <span className="spin-control__lift-mark-line" />
                <span className="spin-control__lift-mark-value">0°</span>
              </div>
              <div
                className="spin-control__lift-mark"
                style={{ bottom: `${(200 * cueLift) / Math.PI}%` }}
              >
                <span className="spin-control__lift-mark-line is-indicator" />
                <span className="spin-control__lift-mark-value is-indicator">
                  {((cueLift / Math.PI) * 180).toFixed(0)}°
                </span>
              </div>
            </div>
          </div>
        </Surface>
      )}
    </div>
  );
};
