import { ECS, StartupSystem } from '@common/ecs';
import { CueMesh } from './cue-mesh.component';
import { Cue } from './cue.component';

export class CueSetupSystem extends StartupSystem {
  public run(ecs: ECS): void {
    const cueMesh = CueMesh.create();
    ecs.createAndSpawn(Cue.create(), cueMesh, cueMesh.getObject3DComponent());
  }
}
