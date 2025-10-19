import { createSystem } from '@common/ecs/func';
import { vec } from '@common/math';
import { Shot } from '@common/simulation/shot';
import { Line } from '../../models/line';
import { SystemState } from '../../resources/system-state';
import { toQuaternion, toVector3 } from '../../util/three-interop';
import { Cue } from '../cue/cue.component';
import { Physics } from '../physics/physics.component';
import type { Result } from '../physics/simulation/result';
import { createSimulationState } from '../physics/simulation/state';
import { runWorkerSimulation } from '../physics/simulation/worker/run';
import { Cushion } from '../table/cushion.component';
import { Pocket } from '../table/pocket.component';
import { Projection } from './projection.component';

const CONSOLE_TIME = true;

export const projectionUpdateSystem = createSystem(
  [Physics, Projection],
  (() => {
    let result: Result | undefined = undefined;
    let computing = false;
    let lastKey = 0n;

    return {
      // compute simulation result
      before: (ecs, entities) => {
        if (entities.size === 0) {
          console.warn('skipping projection update - no ball entities');
          return false;
        }

        const cue = ecs.query().resolveFirst(Cue);
        const shot = Shot.from(cue);

        if (lastKey === Shot.getKey(shot) || computing) {
          // no need to recalculate
          return true;
        }

        const system = ecs.resource(SystemState);
        const balls = [...entities].flatMap((entity) =>
          ecs.get(entity, Physics)
        );
        const cushions = ecs.query().resolveAll(Cushion);
        const pockets = ecs.query().resolveAll(Pocket);

        const state = createSimulationState(balls, cushions, pockets);
        (async () => {
          CONSOLE_TIME && console.time('projection-compute');
          computing = true;
          result = await runWorkerSimulation({
            params: system.params,
            shot,
            state,
            trackPath: true,
          });
          lastKey = Shot.getKey(shot);
          computing = false;
          CONSOLE_TIME && console.timeEnd('projection-compute');
          console.log(result);
        })();

        return true;
      },
      // apply to projection components
      run: (ecs, entity) => {
        if (!result) {
          const [projection] = ecs.get(entity, Projection);
          projection.root.visible = false;
          return;
        }

        const [physics, projection] = ecs.get(entity, Physics, Projection);

        const trackingPoints = result.trackingPoints.get(physics.id);
        if (!trackingPoints || trackingPoints.length === 0) {
          projection.root.visible = false;
          return;
        }

        const endPoint = trackingPoints.at(-1)!;

        if (vec.eq(endPoint.position, projection.lastEndPoint)) {
          // skip update if result hasn't changed
          // todo: efficiently update line billboard here
          return;
        }

        if (vec.distSq(physics.r, endPoint.position) < 1e-8) {
          // ignore projections that haven't moved / are too close
          // prevents z-fighting
          projection.root.visible = false;
          return;
        }

        projection.root.visible = true;

        // move projected ball
        projection.ball.position.copy(toVector3(endPoint.position));
        projection.ball.rotation.setFromQuaternion(
          toQuaternion(endPoint.orientation)
        );

        // update line
        Line.update(
          projection.line,
          trackingPoints.map((p) => p.position)
        );

        projection.lastEndPoint = endPoint.position;
      },
    };
  })()
);
