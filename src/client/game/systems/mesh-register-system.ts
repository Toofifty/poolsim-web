import type { Scene } from 'three';
import { ECS, System, type Entity } from '../../../common/ecs';
import { Renderable } from '../components/renderable';
import type { Game } from '../game';

export class MeshRegisterSystem extends System<Game> {
  public components: Set<Function> = new Set([Renderable]);

  constructor(private scene: Scene) {
    super();
  }

  public added(ecs: ECS<any, Game>, entity: Entity): void {
    const [{ mesh }] = ecs.get(entity, Renderable);
    this.scene.add(mesh);
  }

  public removed(ecs: ECS<any, Game>, entity: Entity): void {
    const [{ mesh }] = ecs.get(entity, Renderable);
    this.scene.remove(mesh);
  }
}
