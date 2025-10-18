import { createPlugin } from '@common/ecs/func';
import type { GameEvents } from '../../events';
import { BallInHandHoverSystem } from './ball-in-hand-hover.system';
import { BallInHandInputSystem } from './ball-in-hand-input.system';
import { GameOverSystem } from './game-over.system';
import { MoveBallInHandSystem } from './move-ball-in-hand.system';
import { pickupBallSystem } from './pickup-ball.system';
import { placeBallSystem } from './place-ball.system';
import { StateUpdateSystem } from './state-update.system';

export const gameplayPlugin = createPlugin<GameEvents>((ecs) => {
  const stateUpdateSystem = ecs.addEventSystem(new StateUpdateSystem());
  const gameOverSystem = ecs.addEventSystem(new GameOverSystem());
  const ballInHandUpdateSystem = ecs.addEventSystem(
    new BallInHandInputSystem()
  );
  ecs.addEventSystem(pickupBallSystem);
  ecs.addEventSystem(placeBallSystem);
  const ballInHandHoverSystem = ecs.addSystem(new BallInHandHoverSystem());
  const moveBallInHandSystem = ecs.addSystem(new MoveBallInHandSystem());

  return () => {
    ecs.removeEventSystem(stateUpdateSystem);
    ecs.removeEventSystem(gameOverSystem);
    ecs.removeEventSystem(ballInHandUpdateSystem);
    ecs.removeEventSystem(pickupBallSystem);
    ecs.removeEventSystem(placeBallSystem);
    ecs.removeSystem(ballInHandHoverSystem);
    ecs.removeSystem(moveBallInHandSystem);
  };
});
