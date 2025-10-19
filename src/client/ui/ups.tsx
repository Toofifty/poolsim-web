import { Flex, Slider } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useSnapshot } from 'valtio';
import { Game } from '../game/game';
import { useGameContext } from '../util/game-provider';
import { Surface } from './surface';

export const Ups = () => {
  const ecs = useGameContext().ecs;
  const {
    simulation: { playbackSpeed },
  } = useSnapshot(Game.instance.params);

  const [fps, setFps] = useState(0);
  const [ups, setUps] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFps(Game.instance.updateCounter.ups);
      setUps(Game.instance.fixedUpdateCounter.ups);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Flex align="end" justify="start">
      <Surface>
        <div className="group lower">
          <span>{playbackSpeed.toFixed(2)}x</span>
          <Slider
            value={playbackSpeed}
            onChange={(value) => {
              Game.instance.params.simulation.playbackSpeed = value;
              ecs.emit('input/param-change', {
                key: 'simulation.playbackSpeed',
                value,
              });
            }}
            w={200}
            min={0.05}
            max={2}
            step={0.05}
            label={null}
            marks={[0, 0.5, 1, 1.5, 2].map((value) => ({ value }))}
          />
          <span>FPS: {fps.toFixed(2)}</span>
          <span>UPS: {ups.toFixed(2)}</span>
        </div>
      </Surface>
    </Flex>
  );
};
