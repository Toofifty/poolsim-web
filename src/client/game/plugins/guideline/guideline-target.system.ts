import { ECS, System, type Entity } from '@common/ecs';
import { Shot } from '@common/simulation/shot';
import { assert } from '@common/util';
import { PlayState } from '../../controller/game-controller';
import { SystemState } from '../../resources/system-state';
import { Cue } from '../cue/cue.component';
import { Physics } from '../physics/physics.component';
import { createSimulationState } from '../physics/simulation/step';
import { runWorkerSimulation } from '../physics/simulation/worker/run';
import { Cushion } from '../table/cushion.component';
import { Pocket } from '../table/pocket.component';
import { Guideline } from './guideline.component';

export class GuidelineTargetSystem extends System {
  public components: Set<Function> = new Set([Guideline]);

  public async run(ecs: ECS<any, unknown>, entity: Entity): Promise<void> {
    const systemState = ecs.resource(SystemState);
    const [guideline] = ecs.get(entity, Guideline);
    if (systemState.playState !== PlayState.PlayerShoot) {
      if (guideline.key !== undefined) {
        guideline.reset();
      }
      return;
    }

    const cue = ecs.query().resolveFirst(Cue);
    const shot = Shot.from(cue);

    if (guideline.key === shot.key) {
      return;
    }

    guideline.reset();
    guideline.key = shot.key;
    guideline.computing = true;

    const balls = ecs.query().resolveAll(Physics);
    const cushions = ecs.query().resolveAll(Cushion);
    const pockets = ecs.query().resolveAll(Pocket);

    if (balls.length === 0) {
      console.warn('skipping guideline update - no ball entities');
      return;
    }

    const state = createSimulationState(balls, cushions, pockets, {
      cueBallOnly: true,
    });
    const result = await runWorkerSimulation({
      shot,
      state,
      trackPath: true,
      // todo: settings
      stopAtFirstContact: true,
    });

    const cueBallPoints = result.trackingPoints.get(0);
    assert(cueBallPoints, 'Failed to track cue ball');
    assert(cueBallPoints.length > 0);

    const endPoint =
      result.collisions.find((collision) => collision.type === 'ball-ball')
        ?.snapshots.initiator ?? cueBallPoints.at(-1);
    assert(endPoint, 'Could not find guideline endpoint');

    guideline.trackingPoints = cueBallPoints;
    guideline.collisionPoint = endPoint;
    // todo: shared invalid check
    guideline.invalid = result.cueBallCollisions === 0;

    const collision = result.collisions.at(0);
    guideline.cueBallVelocity = collision?.initiator.v;

    if (collision?.type === 'ball-ball') {
      guideline.targetBallVelocity = collision.other.v;
      guideline.targetBallPosition = collision.other.r;
      //   guideline.targetBallColor = collision.other.id;
    }

    guideline.computing = false;
  }
}
