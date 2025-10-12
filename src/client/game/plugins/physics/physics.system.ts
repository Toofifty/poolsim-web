import { ECS, System, type Entity } from '@common/ecs';
import { PlayState } from '../../controller/game-controller';
import type { GameEvents } from '../../events';
import { SystemState } from '../../resources/system-state';
import { Cushion } from '../table/cushion.component';
import { Pocket } from '../table/pocket.component';
import { Physics } from './physics.component';
import { createSimulationState } from './simulation/state';
import { simulationStep } from './simulation/step';
import { settled } from './simulation/tools';

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
    const cushions = ecs.query().resolveAll(Cushion);
    const pockets = ecs.query().resolveAll(Pocket);

    const state = createSimulationState(balls, cushions, pockets);
    const result = simulationStep(ecs.deltaTime, state, { trackPath: false });

    result.collisions.forEach((collision) => {
      if (collision.type === 'ball-ball') {
        ecs.emit('game/ball-collision', collision);
      }
      if (collision.type === 'ball-pocket') {
        ecs.emit('game/pocket-collision', collision);
      }
    });

    if (settled(state)) {
      ecs.emit('game/settled', {});
    }
  }
}
