import { ECS, System, type Entity } from '@common/ecs';
import { PlayState } from '../../controller/game-controller';
import type { GameEvents } from '../../events';
import { SystemState } from '../../resources/system-state';
import { Cushion } from '../table/cushion.component';
import { Pocket } from '../table/pocket.component';
import { Physics, PhysicsState } from './physics.component';
import { generateSimulationData, simulationStep } from './simulation/step';

export class PhysicsSystem extends System {
  public components: Set<Function> = new Set([Physics]);

  public runAll(ecs: ECS<GameEvents, unknown>, entities: Set<Entity>): void {
    const systemState = ecs.resource(SystemState);
    if (
      systemState.playState !== PlayState.PlayerInPlay ||
      systemState.paused
    ) {
      return;
    }

    const balls = [...entities]
      .map((entity) => ecs.get(entity, Physics))
      .flat();
    const cushions = ecs
      .queryAll(Cushion)
      .map((entity) => ecs.get(entity, Cushion))
      .flat();
    const pockets = ecs
      .queryAll(Pocket)
      .map((entity) => ecs.get(entity, Pocket))
      .flat();

    const data = generateSimulationData(balls, cushions, pockets);
    const result = simulationStep(ecs.deltaTime, data, { trackPath: false });

    result.collisions.forEach((collision) => {
      if (collision.type === 'ball-ball') {
        ecs.emit('game/ball-collision', collision);
      }
    });

    if (
      balls.every(
        (ball) =>
          ball.state === PhysicsState.Stationary ||
          ball.state === PhysicsState.Pocketed ||
          ball.state === PhysicsState.OutOfPlay
      )
    ) {
      ecs.emit('game/settled', {});
    }
  }
}
