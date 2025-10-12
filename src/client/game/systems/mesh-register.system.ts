import type { Scene } from 'three';
import {
  ComponentTrackingSystem,
  ECS,
  ECSComponent,
  type Entity,
} from '../../../common/ecs';
import { Renderable } from '../components/renderable';

export class MeshRegisterSystem extends ComponentTrackingSystem<Renderable> {
  public predicate: (component: ECSComponent) => component is Renderable = (
    component
  ) => component instanceof Renderable;

  constructor(private scene: Scene) {
    super();
  }

  public added(ecs: ECS, entity: Entity, component: Renderable): void {
    this.scene.add(component.mesh);
  }

  public removed(ecs: ECS, entity: Entity, component: Renderable): void {
    this.scene.remove(component.mesh);
  }
}
