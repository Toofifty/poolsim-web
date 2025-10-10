import { ECS } from '../../common/ecs';
import { Game } from './game';
import { AudioPlugin } from './plugins/audio';
import { CuePlugin } from './plugins/cue';
import { MousePlugin } from './plugins/mouse';
import { PhysicsPlugin } from './plugins/physics';
import { TablePlugin } from './plugins/table';
import { SystemState } from './resources/system-state';
import { BallShootSystem } from './systems/ball-shoot.system';
import { BallUpdateSystem } from './systems/ball-update.system';
import { MeshRegisterSystem } from './systems/mesh-register-system';
import { StateUpdateSystem } from './systems/state-update.system';
import { TableSetupSystem } from './systems/table-setup-system';
import { WorldSetupSystem } from './systems/world-setup-system';

export const createECS = (game: Game) => {
  const ecs = new ECS(game);

  ecs.addResource(SystemState.create());
  ecs.addSystem(new MeshRegisterSystem(game.scene));

  new MousePlugin().install(ecs);
  new CuePlugin().install(ecs);
  new TablePlugin().install(ecs);
  new PhysicsPlugin().install(ecs);
  new AudioPlugin().install(ecs);

  ecs.addStartupSystem(new WorldSetupSystem());

  ecs.addSystem(new BallUpdateSystem());

  ecs.addEventSystem(new TableSetupSystem());
  ecs.addEventSystem(new BallShootSystem());
  ecs.addEventSystem(new StateUpdateSystem());
  return ecs;
};
