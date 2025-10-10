import { ECS, EventSystem } from '@common/ecs';
import { vec, type Vec } from '@common/math';
import { assertExists } from '@common/util';
import { Object3D, Raycaster, type Camera } from 'three';
import { Object3DComponent } from '../../components/mesh';
import type { GameEvents } from '../../events';
import { toVec, toVector2 } from '../../util/three-interop';
import { MousePosition } from './mouse-position.resource';
import { Plane } from './plane.component';

export class MousePositionSystem extends EventSystem<
  'input/mouse-move',
  GameEvents
> {
  public event = 'input/mouse-move' as const;

  private raycaster: Raycaster;

  constructor(private camera: Camera) {
    super();
    this.raycaster = new Raycaster();
  }

  private intersect(screen: Vec, object: Object3D): Vec | undefined {
    this.raycaster.setFromCamera(toVector2(screen), this.camera);
    const intersections = this.raycaster.intersectObject(object);
    if (intersections.length > 0) {
      return toVec(intersections[0].point);
    }
    return undefined;
  }

  public run(
    ecs: ECS<GameEvents, unknown>,
    data: GameEvents['input/mouse-move']
  ): void {
    const mousePosition = ecs.resource(MousePosition);
    vec.mset(mousePosition.screen, data.x, data.y, 0);

    const planeEntity = ecs.query().first(Plane);
    assertExists(planeEntity, 'Missing intersection plane');

    const [{ mesh }] = ecs.get(planeEntity, Object3DComponent);

    const world = this.intersect(mousePosition.screen, mesh);
    if (world) {
      vec.mcopy(mousePosition.world, world);
    }
  }
}
