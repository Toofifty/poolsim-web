import type { LobbyData } from '@common/data';
import { cloneParams, defaultParams } from '@common/simulation/physics';
import type { Socket } from 'socket.io-client';
import { ECS } from '../../common/ecs';
import type { GameEvents } from './events';
import { Game } from './game';
import { AudioPlugin } from './plugins/audio';
import { BallPlugin } from './plugins/ball';
import { CuePlugin } from './plugins/cue';
import { GameplayPlugin } from './plugins/gameplay';
import { GuidelinePlugin } from './plugins/guideline';
import { mousePlugin } from './plugins/mouse';
import { createNetworkPlugin } from './plugins/network';
import { PhysicsPlugin } from './plugins/physics';
import { TablePlugin } from './plugins/table';
import { WorldPlugin } from './plugins/world';
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

export const createECS = (game: Game, socket?: Socket, lobby?: LobbyData) => {
  const ecs = new ECS<GameEvents, Game>(game);

  ecs.addResource(new SystemState(ecs, cloneParams(defaultParams)));
  ecs.addResource(new GameRuleProvider());

  ecs.addComponentTrackingSystem(createMeshRegisterSystem(game.scene));
  ecs.addComponentTrackingSystem(
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
  ecs.addSystem(createBillboardUpdateSystem(game.camera));

  mousePlugin.install(ecs);
  new CuePlugin().install(ecs);
  new TablePlugin().install(ecs);
  new BallPlugin().install(ecs);
  new PhysicsPlugin().install(ecs);
  new AudioPlugin().install(ecs);
  new GuidelinePlugin().install(ecs);
  new GameplayPlugin().install(ecs);

  ecs.addStartupSystem(new SettingsListenerSystem());

  ecs.addSystem(new BallUpdateSystem());

  ecs.addEventSystem(new InputSetupSystem());
  ecs.addEventSystem(new TableSetupSystem());
  ecs.addEventSystem(new BallShootSystem());
  ecs.addEventSystem(new ExternalParamChangeSystem());

  if (socket && lobby) {
    const networkPlugin = createNetworkPlugin(socket, lobby);
    networkPlugin.install(ecs);
  }

  // must be last - emits an event to start the game
  new WorldPlugin().install(ecs);

  return ecs;
};
