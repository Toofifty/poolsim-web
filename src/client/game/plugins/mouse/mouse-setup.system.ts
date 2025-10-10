import { ECS, StartupSystem } from '@common/ecs';
import { Renderable } from '../../components/renderable';
import { PlaneMesh } from './plane-mesh.component';
import { Plane } from './plane.component';

export class MouseSetupSystem extends StartupSystem {
  public run(ecs: ECS): void {
    ecs.createAndSpawn(Plane.create(), [PlaneMesh.create(), Renderable]);
  }
}
