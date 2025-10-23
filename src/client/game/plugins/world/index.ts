import { createPlugin, createStartupSystem } from '@common/ecs/func';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/Addons.js';
import type { GameEvents } from '../../events';
import { RectLight } from './rect-light.component';
import { Sky } from './sky.component';

const spawnWorld = createStartupSystem<GameEvents>((ecs) => {
  RectAreaLightUniformsLib.init();

  ecs.spawnImmediate(
    RectLight.create({
      w: 1.6,
      h: 0.1,
      intensity: 120,
    })
  );

  ecs.spawnImmediate(Sky.create());
});

export const worldPlugin = createPlugin<GameEvents>((ecs) => {
  ecs.addStartupSystem(spawnWorld);

  return () => {
    // todo: destroy rect light and sky
  };
});
