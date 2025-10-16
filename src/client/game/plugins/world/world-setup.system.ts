import { ECS, StartupSystem } from '@common/ecs';
import { Ruleset } from '@common/simulation/physics';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/Addons.js';
import type { GameEvents } from '../../events';
import { RectLight } from './rect-light.component';
import { Sky } from './sky.component';

export class WorldSetupSystem extends StartupSystem {
  public run(ecs: ECS<GameEvents>): void {
    RectAreaLightUniformsLib.init();

    ecs.spawnImmediate(
      RectLight.create({
        w: 1.6,
        h: 0.1,
        intensity: 120,
      })
    );

    ecs.spawnImmediate(Sky.create());

    // setup a game on init
    ecs.emit('input/setup-game', { ruleset: Ruleset._8Ball });
  }
}
