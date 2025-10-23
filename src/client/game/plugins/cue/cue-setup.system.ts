import { ECS, StartupSystem } from '@common/ecs';
import type { GameEvents } from '../../events';
import { CueMesh } from './cue-mesh.component';
import { Cue } from './cue.component';

export class CueSetupSystem extends StartupSystem {
  public run(ecs: ECS<GameEvents>): void {
    const cue = Cue.create();
    ecs.spawnImmediate(cue, CueMesh.create());
    ecs.emit('game/cue-update', cue);
  }
}
