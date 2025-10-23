import { defaultParams } from '@common/simulation/physics';
import { constrain } from '@common/util';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSnapshot } from 'valtio';
import { createCueCanvas } from '../../game/models/cue/create-cue-texture';
import { makeTheme, theme } from '../../game/store/theme';
import { useGameContext } from '../../util/game-provider';
import { Surface } from '../surface';
import { useGameBinding } from '../use-game-binding';
import './pull-to-shoot.scss';
import { useOffsetDrag } from './use-offset-drag';

const shootTime = defaultParams.cue.shootTime;

export const PullToShoot = () => {
  const ecs = useGameContext().ecs;

  const cueForce = useGameBinding('game/cue-update', (cue) => cue.force, 0);

  const [clickArea, setClickArea] = useState<HTMLDivElement | null>(null);

  const [width, height] = useMemo(() => {
    if (clickArea) {
      const rect = clickArea.getBoundingClientRect();
      return [rect.width, rect.height];
    }
    return [0, 0];
  }, [clickArea]);

  const [pull, setPull] = useState(0);
  const pullRef = useRef(0);
  const minThreshold = 0.1;
  const maxThreshold = 0.9;

  const [shooting, setShooting] = useState(false);

  const actualForce = (p: number) =>
    constrain((p - minThreshold) / (maxThreshold - minThreshold), 0, 1);

  const animateShot = () => {
    if (actualForce(pullRef.current) > 0) {
      ecs.emit('game/start-shooting', {
        skipDrawback: true,
      });
    }
    pullRef.current = 0;
    setShooting(true);
    setTimeout(() => {
      setPull(0);
      setShooting(false);
    }, shootTime);
  };

  const props = useOffsetDrag(
    {
      update: ({ y }) => {
        setPull(y);
        pullRef.current = y;
        const f = actualForce(y);
        ecs.emit('input/cue-update', {
          drawback: f > 0 ? (f * defaultParams.cue.maxForce) / 16 : 0,
          force:
            f > 0
              ? f * defaultParams.cue.maxForce
              : defaultParams.cue.defaultForce,
        });
      },
      end: () => {
        animateShot();
      },
    },
    { y: [0, maxThreshold] },
    []
  );

  const progressColor = actualForce(pull);

  return (
    <Surface className="pull-to-shoot">
      <div ref={setClickArea} className="pull-to-shoot__click-area" {...props}>
        <div
          className="pull-to-shoot__power-color"
          style={{
            opacity: pull > minThreshold && !shooting ? 0.9 : 0,
            backgroundColor: `hsl(${(1 - progressColor) * 100}, 100%, 50%)`,
          }}
        />
        <div className="pull-to-shoot__notch" style={{ top: '10%' }} />
        <div className="pull-to-shoot__notch" style={{ top: '30%' }} />
        <div className="pull-to-shoot__notch" style={{ top: '50%' }} />
        <div className="pull-to-shoot__notch" style={{ top: '70%' }} />
        <div className="pull-to-shoot__notch" style={{ top: '90%' }} />
        <div
          className="pull-to-shoot__cue-offset"
          style={{
            transition: shooting ? `transform ${shootTime}ms` : undefined,
            transform: shooting
              ? 'translateY(0)'
              : `translateY(${pull * height}px)`,
          }}
        >
          <Cue />
        </div>
      </div>
    </Surface>
  );
};

const Cue = () => {
  const themeSnapshot = useSnapshot(theme);
  const root = useRef<HTMLDivElement>(null);

  const canvas = useMemo(() => {
    return createCueCanvas(defaultParams, makeTheme());
  }, [themeSnapshot]);

  useEffect(() => {
    if (!canvas) return;

    root.current?.appendChild(canvas);

    return () => {
      root.current?.removeChild(canvas);
    };
  }, [canvas]);

  return (
    <div className="pull-to-shoot__cue__container">
      <div ref={root} className="pull-to-shoot__cue" />
    </div>
  );
};
