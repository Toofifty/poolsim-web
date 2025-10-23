import { createSystem } from '@common/ecs/func';
import { vec } from '@common/math';
import { Shot } from '@common/simulation/shot';
import { Line } from '../../models/line';
import { SystemState } from '../../resources/system-state';
import { settings } from '../../store/settings';
import { toQuaternion, toVector3 } from '../../util/three-interop';
import { Cue } from '../cue/cue.component';
import { getColor } from '../guideline/guideline-update.system';
import { AccumulatedResult } from '../physics/accumulated-result.resource';
import { Physics } from '../physics/physics.component';
import { prepareSimulation } from '../physics/prepare-simulation';
import type { Result } from '../physics/simulation/result';
import { runWorkerSimulation } from '../physics/simulation/worker/run';
import { Projection } from './projection.component';

const CONSOLE_TIME = false;

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

        const state = prepareSimulation(ecs, { ballEntities: entities });
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
        const accumulatedResult = ecs.resource(AccumulatedResult).result;

        if (
          accumulatedResult === undefined &&
          vec.eq(endPoint.position, projection.lastEndPoint)
        ) {
          // skip update if result hasn't changed
          // if there is an acc result from the physics system
          // running, we can use that to show updated paths instead
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

        const points = accumulatedResult
          ? trackingPoints.filter(
              ({ frame }) =>
                frame === undefined || accumulatedResult!.steps < frame
            )
          : trackingPoints;

        const { physicsGuidelines } = settings;

        // update line
        Line.update(
          projection.line,
          points.map((p) => p.position),
          physicsGuidelines ? points.map((p) => getColor(p.state)) : undefined
        );

        projection.lastEndPoint = endPoint.position;
      },
    };
  })()
);
