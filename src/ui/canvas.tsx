import { useLayoutEffect, useRef } from 'react';
import './index.scss';
import { Game } from '../game/game';
import { useSnapshot } from 'valtio';
import { settings } from '../game/settings';

export const Canvas = ({ game }: { game: Game }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { highDetail } = useSnapshot(settings);
  useLayoutEffect(
    () => (containerRef.current ? game.mount(containerRef.current) : undefined),
    [game, highDetail]
  );
  return <div className="canvas-container" ref={containerRef} />;
};
