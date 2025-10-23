import { Resource } from '@common/ecs';
import { createPlugin, createStartupSystem } from '@common/ecs/func';
import { AimAssistMode } from '@common/simulation/physics';
import type { GameEvents } from '../events';
import { SystemState } from '../resources/system-state';
import { createParamUpdateSystem } from '../systems/param-update.system';
import { guidelinePlugin } from './guideline';
import { projectionPlugin } from './projection';

const getPlugin = (mode: AimAssistMode) => {
  switch (mode) {
    case AimAssistMode.Off:
      return undefined;
    case AimAssistMode.Full:
      return projectionPlugin;
    default:
      return guidelinePlugin;
  }
};

class AimAssistUninstaller extends Resource {
  public uninstall?: () => void;
}

const initialiseAimAssist = createStartupSystem<GameEvents>((ecs) => {
  const system = ecs.resource(SystemState);
  const plugin = getPlugin(system.params.game.aimAssist);
  if (plugin) {
    const uninstaller = ecs.resource(AimAssistUninstaller);
    uninstaller.uninstall = plugin.install(ecs);
  }
});

const updateAimAssist = createParamUpdateSystem(
  (m) => m.includes('game.aimAssist'),
  (ecs, params) => {
    const uninstaller = ecs.resource(AimAssistUninstaller);
    uninstaller.uninstall?.();
    uninstaller.uninstall = undefined;
    const plugin = getPlugin(params.game.aimAssist);
    if (plugin) {
      uninstaller.uninstall = plugin.install(ecs);
    }
  }
);

const destroyAimAssist = createStartupSystem<GameEvents>((ecs) => {
  const uninstaller = ecs.resource(AimAssistUninstaller);
  uninstaller.uninstall?.();
  uninstaller.uninstall = undefined;
});

export const aimAssistPlugin = createPlugin<GameEvents>((ecs) => {
  ecs.addResource(new AimAssistUninstaller());
  ecs.addStartupSystem(initialiseAimAssist);
  ecs.addEventSystem(updateAimAssist);

  return () => {
    ecs.addStartupSystem(destroyAimAssist);
    ecs.removeEventSystem(updateAimAssist);
  };
});
