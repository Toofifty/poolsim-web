import { useCallback } from 'react';
import './index.scss';
import type { Game } from '../game/game';

export const Canvas = ({ game }: { game: Game }) => {
  const setContainer = useCallback(
    (container: HTMLDivElement | null) => game.mount(container),
    [game]
  );
  return <div className="canvas-container" ref={setContainer} />;
};
