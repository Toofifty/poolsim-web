import { useLayoutEffect, useRef } from 'react';
import { useSnapshot } from 'valtio';
import { Game } from '../game/game';
import { settings } from '../game/store/settings';
import './index.scss';

export const Canvas = ({ game }: { game: Game }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { highDetail, ortho } = useSnapshot(settings);
  useLayoutEffect(
    () => (containerRef.current ? game.mount(containerRef.current) : undefined),
    [game, highDetail, ortho]
  );
  return (
    <div
      className="canvas-container"
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};
