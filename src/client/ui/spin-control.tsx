import { ActionIcon, Button, Stack } from '@mantine/core';
import {
  IconArrowsHorizontal,
  IconArrowsVertical,
  IconChevronRight,
  IconRefresh,
  IconRotate360,
} from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { useGameContext } from '../util/game-provider';
import './spin-control.scss';
import { Surface } from './surface';
import { useGameEvent } from './use-game-event';
import { useIsMobile } from './use-media-query';
import { useMouseInputs } from './use-mouse-inputs';

export const SpinControl = () => {
  const ecs = useGameContext().ecs;
  const [lift, setLift] = useState(0);
  const [side, setSide] = useState(0);
  const [top, setTop] = useState(0);

  useGameEvent(
    'game/cue-update',
    (cue) => {
      setLift(cue.lift);
      setSide(-cue.side);
      setTop(-cue.top);
    },
    []
  );

  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(!isMobile);

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
      const rx = 0.5 - x;
      const ry = 0.5 - y;

      if (Math.sqrt(rx * rx + ry * ry) > 0.5) return;

      ecs.emit('input/cue-update', {
        top: lockTopSpin ? 0 : ry,
        side: lockSideSpin ? 0 : rx,
      });
    },
    [ecs, lockSideSpin, lockTopSpin]
  );

  const liftAreaProps = useMouseInputs(
    ({ y }) => {
      if (y <= 0.01) y = 0.01;
      ecs.emit('input/cue-update', {
        lift: ((1 - y) * Math.PI) / 2,
      });
    },
    [ecs]
  );

  return (
    <div className="spin-control__container">
      {visible ? (
        <ActionIcon
          className="surface button icon"
          size="40"
          onClick={() => setVisible((v) => !v)}
        >
          <IconChevronRight size={16} />
        </ActionIcon>
      ) : (
        <Button
          className="surface button"
          size="40"
          onClick={() => setVisible((v) => !v)}
          rightSection={<IconRotate360 size="16" />}
        >
          Spin
        </Button>
      )}
      {visible && (
        <Surface className="spin-control" p="md">
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
                ecs.emit('input/cue-update', {
                  lift: 0,
                  top: 0,
                  side: 0,
                });
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
                transform: `translate(${side * width}px, ${top * height}px)`,
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
                style={{ bottom: `${(200 * lift) / Math.PI}%` }}
              >
                <span className="spin-control__lift-mark-line is-indicator" />
                <span className="spin-control__lift-mark-value is-indicator">
                  {((lift / Math.PI) * 180).toFixed(0)}°
                </span>
              </div>
            </div>
          </div>
        </Surface>
      )}
    </div>
  );
};
