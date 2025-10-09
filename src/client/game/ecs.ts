import { ECS } from '../../common/ecs';
import { Game } from './game';
import { BallPhysicsSystem } from './systems/ball-physics';
import { GameSetupSystem } from './systems/game-setup-system';

export const createECS = (game: Game) => {
  const ecs = new ECS(game);
  ecs.addSystem(new BallPhysicsSystem());
  ecs.addEventSystem(new GameSetupSystem());
};
