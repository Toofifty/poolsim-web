import type { LobbyData } from '@common/data';
import { createStartupSystem } from '@common/ecs/func';
import { Ruleset, type Params } from '@common/simulation/physics';
import type { Socket } from 'socket.io-client';
import { ECS } from '../../common/ecs';
import type { GameEvents } from './events';
import { Game } from './game';
import { aimAssistPlugin } from './plugins/aim-assist';
import { audioPlugin } from './plugins/audio';
import { ballPlugin } from './plugins/ball';
import { cuePlugin } from './plugins/cue';
import { bumperPlugin } from './plugins/extra/bumper';
import { gameplayPlugin } from './plugins/gameplay';
import { mousePlugin } from './plugins/mouse';
import { createNetworkPlugin } from './plugins/network';
import { physicsPlugin } from './plugins/physics';
import { tablePlugin } from './plugins/table';
import { worldPlugin } from './plugins/world';
import { GameRuleProvider } from './resources/game-rules';
import { SystemState } from './resources/system-state';
import { BallShootSystem } from './systems/ball-shoot.system';
import { BallUpdateSystem } from './systems/ball-update.system';
import { createBillboardUpdateSystem } from './systems/billboard-update.system';
import { ExternalParamChangeSystem } from './systems/external-param-change.system';
import { InputSetupSystem } from './systems/input-setup.system';
import {
  createMeshRegisterSystem,
  createOverlayRegisterSystem,
} from './systems/mesh-register.system';
import { SettingsListenerSystem } from './systems/settings-listener.system';
import { TableSetupSystem } from './systems/table-setup-system';

const installPlugins = (
  ecs: ECS<GameEvents, Game>,
  plugins: { install: (ecs: ECS<GameEvents, Game>) => () => void }[]
) => {
  const uninstallers = plugins.map((plugin) => plugin.install(ecs));
  return () => uninstallers.forEach((uninstall) => uninstall());
};

export const createECS = (
  params: Params,
  socket?: Socket,
  lobby?: LobbyData
) => {
  const ecs = new ECS<GameEvents, Game>();
  const game = new Game(ecs, params);
  ecs.game = game;

  ecs.addResource(SystemState.create(ecs, params, socket, lobby));
  ecs.addResource(new GameRuleProvider());

  const meshRegisterSystem = ecs.addComponentTrackingSystem(
    createMeshRegisterSystem(game.scene)
  );
  const overlayRegisterSystem = ecs.addComponentTrackingSystem(
    createOverlayRegisterSystem(
      game.overlay,
      game.darkOutlineScene,
      game.lightOutlineScene,
      game.redOutlineScene,
      game.darkOutlinePass.selectedObjects,
      game.lightOutlinePass.selectedObjects,
      game.redOutlinePass.selectedObjects
    )
  );
  const billboardUpdateSystem = ecs.addSystem(
    createBillboardUpdateSystem(game.camera)
  );

  const uninstallPlugins = installPlugins(ecs, [
    mousePlugin,
    cuePlugin,
    tablePlugin,
    ballPlugin,
    physicsPlugin,
    audioPlugin,
    gameplayPlugin,
    aimAssistPlugin,
    bumperPlugin,
  ]);

  ecs.addStartupSystem(new SettingsListenerSystem());

  ecs.addSystem(new BallUpdateSystem());

  ecs.addEventSystem(new InputSetupSystem());
  ecs.addEventSystem(new TableSetupSystem());
  ecs.addEventSystem(new BallShootSystem());
  ecs.addEventSystem(new ExternalParamChangeSystem());

  let uninstallNetworkPlugin: (() => void) | undefined = undefined;
  if (socket && lobby) {
    console.log('ecs - installing networking');
    const networkPlugin = createNetworkPlugin(socket, lobby);
    uninstallNetworkPlugin = networkPlugin.install(ecs);
  } else {
    // start game immediately
    ecs.addStartupSystem(
      createStartupSystem<GameEvents>((ecs) =>
        ecs.emit('input/setup-game', { ruleset: Ruleset._8Ball })
      )
    );
  }

  const uninstallWorldPlugin = worldPlugin.install(ecs);

  const destroy = () => {
    ecs.removeComponentTrackingSystem(meshRegisterSystem);
    ecs.removeComponentTrackingSystem(overlayRegisterSystem);
    ecs.removeSystem(billboardUpdateSystem);

    uninstallPlugins();

    uninstallNetworkPlugin?.();
    uninstallWorldPlugin();
  };

  return [ecs, destroy] as const;
};
