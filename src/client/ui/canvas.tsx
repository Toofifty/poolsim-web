import { useLayoutEffect, useRef } from 'react';
import { Game } from '../game/game';
import './index.scss';

export const Canvas = ({ game }: { game: Game }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mounted = useRef(false);

  useLayoutEffect(() => {
    if (mounted.current || !containerRef.current) return;
    game.mount(containerRef.current);
    mounted.current = true;
    // todo: unmount (and fix 2x effect)
  }, []);

  return (
    <div
      className="canvas-container"
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};
