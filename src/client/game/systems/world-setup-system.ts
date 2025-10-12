import { Ruleset } from '@common/simulation/physics';
import { ECS, StartupSystem } from '../../../common/ecs';
import type { GameEvents } from '../events';

export class WorldSetupSystem extends StartupSystem {
  public run(ecs: ECS<GameEvents>): void {
    ecs.emit('input/setup-game', { ruleset: Ruleset._8Ball });
  }
}
