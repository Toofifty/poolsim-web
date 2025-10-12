import { ECS, StartupSystem } from '@common/ecs';
import { PlaneMesh } from './plane-mesh.component';
import { Plane } from './plane.component';

export class MouseSetupSystem extends StartupSystem {
  public run(ecs: ECS): void {
    ecs.spawn(Plane.create(), PlaneMesh.create());
  }
}
