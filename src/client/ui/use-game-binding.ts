import { useState } from 'react';
import type { GameEvents } from '../game/events';
import { useGameEvent } from './use-game-event';

export const useGameBinding = <TEvent extends keyof GameEvents, TValue>(
  event: TEvent,
  getter: (data: GameEvents[TEvent]) => TValue,
  def: TValue
) => {
  const [value, setValue] = useState<TValue>(def);
  useGameEvent(event, (data) => setValue(getter(data)));
  return value;
};
