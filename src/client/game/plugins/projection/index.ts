import { createPlugin } from '@common/ecs/func';
import type { GameEvents } from '../../events';

export const projectionPlugin = createPlugin<GameEvents>((ecs) => {
  return () => {};
});
