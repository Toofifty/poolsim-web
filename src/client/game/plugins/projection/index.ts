import { createPlugin, createStartupSystem } from '@common/ecs/func';
import type { GameEvents } from '../../events';
import { projectionUpdateSystem } from './projection-update.system';
import { Projection } from './projection.component';

const hideProjections = createStartupSystem((ecs) => {
  ecs.queryAll(Projection).forEach((entity) => {
    const [projection] = ecs.get(entity, Projection);
    projection.root.visible = false;
  });
});

export const projectionPlugin = createPlugin<GameEvents>((ecs) => {
  ecs.addSystem(projectionUpdateSystem);

  return () => {
    ecs.addStartupSystem(hideProjections);
    ecs.removeSystem(projectionUpdateSystem);
  };
});
