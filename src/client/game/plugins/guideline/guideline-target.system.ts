import { ECS, System, type Entity } from '@common/ecs';
import { Shot } from '@common/simulation/shot';
import { assert } from '@common/util';
import { GameRuleProvider } from '../../resources/game-rules';
import { SystemState } from '../../resources/system-state';
import { Cue } from '../cue/cue.component';
import { getActiveBallIds } from '../gameplay/get-active-ball-ids';
import { InHand } from '../gameplay/in-hand.component';
import { Physics } from '../physics/physics.component';
import { hasImmediateFoul } from '../physics/simulation/result';
import { createSimulationState } from '../physics/simulation/state';
import { runWorkerSimulation } from '../physics/simulation/worker/run';
import { Cushion } from '../table/cushion.component';
import { Pocket } from '../table/pocket.component';
import { Guideline } from './guideline.component';

const CONSOLE_TIME = false;

export class GuidelineTargetSystem extends System {
  public components: Set<Function> = new Set([Guideline]);

  public async run(ecs: ECS<any, unknown>, entity: Entity): Promise<void> {
    const system = ecs.resource(SystemState);
    const [guideline] = ecs.get(entity, Guideline);
    const ballInHandEntity = ecs.query().has(InHand).findOne();
    if (!system.isShootable || ballInHandEntity !== undefined) {
      if (guideline.key !== undefined) {
        guideline.reset();
      }
      return;
    }

    const cue = ecs.query().resolveFirst(Cue);
    const shot = Shot.from(cue);

    if (guideline.key === shot.key || guideline.computing) {
      return;
    }

    guideline.computing = true;

    CONSOLE_TIME && console.time('guideline-update');
    CONSOLE_TIME && console.time('guideline-query');

    const balls = ecs.query().resolveAll(Physics);
    const cushions = ecs.query().resolveAll(Cushion);
    const pockets = ecs.query().resolveAll(Pocket);

    const rules = ecs
      .resource(GameRuleProvider)
      .getRules(getActiveBallIds(ecs), {
        isBreak: system.isBreak,
        turn: system.currentPlayer8BallState,
      });

    CONSOLE_TIME && console.timeEnd('guideline-query');

    if (balls.length === 0) {
      console.warn('skipping guideline update - no ball entities');
      CONSOLE_TIME && console.timeEnd('guideline-update');
      guideline.computing = false;
      return;
    }

    const state = createSimulationState(balls, cushions, pockets, {
      cueBallOnly: true,
    });
    const result = await runWorkerSimulation({
      params: system.params,
      shot,
      state,
      trackPath: true,
      // todo: settings
      stopAtFirstContact: true,
    });

    guideline.reset();
    guideline.key = shot.key;

    const cueBallPoints = result.trackingPoints.get(0);
    assert(cueBallPoints, 'Failed to track cue ball');
    assert(cueBallPoints.length > 0);

    const endPoint =
      result.collisions.find((collision) => collision.type === 'ball-ball')
        ?.snapshots.initiator ?? cueBallPoints.at(-1);
    assert(endPoint, 'Could not find guideline endpoint');

    guideline.trackingPoints = cueBallPoints;
    guideline.collisionPoint = endPoint;
    guideline.invalid = hasImmediateFoul(result, rules);

    const collision = result.collisions.at(0);
    guideline.cueBallVelocity = collision?.initiator.v;

    if (collision?.type === 'ball-ball') {
      guideline.targetBallVelocity = collision.other.v;
      guideline.targetBallPosition = collision.other.r;
      //   guideline.targetBallColor = collision.other.id;
    }

    guideline.computing = false;
    CONSOLE_TIME && console.timeEnd('guideline-update');
  }
}
