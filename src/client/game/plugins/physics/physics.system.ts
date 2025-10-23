import { ECS, System, type Entity } from '@common/ecs';
import type { GameEvents } from '../../events';
import { GameRuleProvider } from '../../resources/game-rules';
import type { GameRules } from '../../resources/game-rules/types';
import { GameState, SystemState } from '../../resources/system-state';
import { getActiveBallIds } from '../gameplay/get-active-ball-ids';
import { AccumulatedResult } from './accumulated-result.resource';
import { OldPhysics, Physics } from './physics.component';
import { prepareSimulation } from './prepare-simulation';
import { combine, createResult } from './simulation/result';
import { simulationStep } from './simulation/step';
import { settled } from './simulation/tools';

export class PhysicsSystem extends System {
  public components: Set<Function> = new Set([Physics]);

  private gameRules?: GameRules;

  public runAll(ecs: ECS<GameEvents, unknown>, entities: Set<Entity>): void {
    const system = ecs.resource(SystemState);
    const acc = ecs.resource(AccumulatedResult);
    if (system.gameState !== GameState.Playing || system.paused) {
      if (acc.result !== undefined) {
        acc.result = undefined;
      }
      return;
    }

    if (!acc.result) {
      acc.result = createResult();
      this.gameRules = ecs
        .resource(GameRuleProvider)
        .getRules(getActiveBallIds(ecs, entities), {
          isBreak: system.isBreak,
          turn: system.currentPlayer8BallState,
        });
    }

    // push old physics states
    [...entities].forEach((entity) => {
      const [physics, oldPhysics] = ecs.get(entity, Physics, OldPhysics);
      OldPhysics.copy(oldPhysics, physics);
    });

    const balls = [...entities]
      .map((entity) => ecs.get(entity, Physics))
      .flat();

    const state = prepareSimulation(ecs, { ballEntities: entities });
    const result = simulationStep(ecs.deltaTime, state, {
      trackPath: false,
      params: system.params,
    });

    const now = performance.now();
    balls.forEach((ball) => (ball.ts = now));

    result.collisions.forEach((collision) => {
      if (collision.type === 'ball-ball') {
        ecs.emit('game/ball-collision', collision);
      }
      if (collision.type === 'ball-pocket') {
        ecs.emit('game/pocket-collision', collision);
      }
    });

    result.ballsEjected.forEach((id) => {
      ecs.emit('game/ball-ejected', id);
    });

    acc.result = combine(acc.result, result);

    if (settled(state)) {
      ecs.emit('game/settled', {
        result: acc.result,
        rules: this.gameRules!,
      });
      system.isBreak = false;
    }
  }
}
