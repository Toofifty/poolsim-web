import { ECS, StartupSystem } from '@common/ecs';
import { Object3DComponent } from '../../components/mesh';
import { PlaneMesh } from './plane-mesh.component';
import { Plane } from './plane.component';

export class MouseSetupSystem extends StartupSystem {
  public run(ecs: ECS): void {
    ecs.createAndSpawn(Plane.create(), [PlaneMesh.create(), Object3DComponent]);
  }
}
