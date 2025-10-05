import { createContext, useContext } from 'react';
import type { Game } from '../game/game';

export const GameContext = createContext<Game | undefined>(undefined);
export const useGameContext = () => {
  const game = useContext(GameContext);
  if (!game) {
    throw new Error('Missing GameContext.Provider');
  }
  return game;
};
