import { createEventSystemFactory, createPlugin } from '@common/ecs/func';
import { vec, type Vec } from '@common/math';
import { TorusGeometry } from 'three';
import { Renderable } from '../../components/renderable';
import type { GameEvents } from '../../events';
import { createMaterial } from '../../rendering/create-material';
import { SystemState } from '../../resources/system-state';
import { toVector3 } from '../../util/three-interop';
import { MousePosition } from '../mouse/mouse-position.resource';
import { Collider } from '../physics/collider.component';

const createEventSystem = createEventSystemFactory<GameEvents>();

const material = createMaterial({
  color: 0xffffff,
});

const spawnBumperSystem = createEventSystem(
  'input/spawn-bumper',
  (ecs, { radius }) => {
    const system = ecs.resource(SystemState);
    const mouse = ecs.resource(MousePosition);

    const arcSegments = 20;
    const renderable = Renderable.createMesh(
      new TorusGeometry(radius * 0.99, radius * 0.01),
      material
    );
    renderable.mesh.position.copy(toVector3(mouse.world));
    renderable.mesh.position.z = system.params.ball.radius;
    renderable.mesh.castShadow = true;
    // renderable.mesh.rotation.x = Math.PI / 2;

    const vertices: Vec[] = [];
    for (let i = 0; i < arcSegments; i++) {
      const angle = (i / arcSegments) * Math.PI * 2;
      const norm = vec.new(Math.cos(angle), Math.sin(angle));
      vertices.push(vec.add(mouse.world, vec.mult(norm, radius)));
    }

    ecs.spawn(renderable, Collider.create(vertices, 1));
  }
);

export const bumperPlugin = createPlugin<GameEvents>((ecs) => {
  ecs.addEventSystem(spawnBumperSystem);

  return () => {
    ecs.removeEventSystem(spawnBumperSystem);
  };
});
