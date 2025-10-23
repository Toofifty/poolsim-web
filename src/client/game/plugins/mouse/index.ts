import { createPlugin, createStartupSystem } from '@common/ecs/func';
import type { GameEvents } from '../../events';
import type { Game } from '../../game';
import { MousePosition } from './mouse-position.resource';
import { createMousePositionSystem } from './mouse-position.system';
import { PlaneMesh } from './plane-mesh.component';
import { Plane } from './plane.component';

export const mousePlugin = createPlugin<GameEvents, Game>((ecs) => {
  const mousePosition = ecs.addResource(MousePosition.create());
  ecs.addStartupSystem(
    createStartupSystem((ecs) => {
      ecs.spawn(Plane.create(), PlaneMesh.create());
    })
  );
  const trackMousePosition = ecs.addEventSystem(
    createMousePositionSystem(ecs.game.camera)
  );

  return () => {
    ecs.removeResource(mousePosition);
    ecs.removeEventSystem(trackMousePosition);
  };
});
