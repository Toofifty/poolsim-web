import type { Scene } from 'three';
import { ECS, System, type Entity } from '../../../common/ecs';
import { Object3DComponent } from '../components/mesh';
import type { Game } from '../game';

export class MeshRegisterSystem extends System<Game> {
  public components: Set<Function> = new Set([Object3DComponent]);

  constructor(private scene: Scene) {
    super();
  }

  public added(ecs: ECS<any, Game>, entity: Entity): void {
    const [{ mesh }] = ecs.get(entity, Object3DComponent);
    this.scene.add(mesh);
  }

  public removed(ecs: ECS<any, Game>, entity: Entity): void {
    const [{ mesh }] = ecs.get(entity, Object3DComponent);
    this.scene.remove(mesh);
  }
}
