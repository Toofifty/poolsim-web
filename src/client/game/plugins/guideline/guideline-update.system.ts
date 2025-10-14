import { ECS, System, type Entity } from '@common/ecs';
import { vec } from '@common/math';
import { assert } from '@common/util';
import { Color } from 'three';
import { LineMesh } from '../../components/line-mesh.component';
import { SystemState } from '../../resources/system-state';
import { settings } from '../../store/settings';
import { toVector3 } from '../../util/three-interop';
import { Cue } from '../cue/cue.component';
import { PhysicsState } from '../physics/physics.component';
import { Guideline } from './guideline.component';
import { ImpactPointMesh } from './impact-point-mesh.component';

const getColor = (state: PhysicsState) => {
  switch (state) {
    case PhysicsState.Airborne:
      // orange
      return new Color(0xff8800);
    case PhysicsState.Sliding:
      // yellow
      return new Color(0xffff00);
    case PhysicsState.Rolling:
      // green
      return new Color(0x00ff00);
    case PhysicsState.Spinning:
      // blue
      return new Color(0x0000ff);
    case PhysicsState.Stationary:
      // white
      return new Color(0xffffff);
    case PhysicsState.Pocketed:
      // red
      return new Color(0xff0000);
    default:
      return new Color(0x000000);
  }
};

const CONSOLE_TIME = false;

export class GuidelineUpdateSystem extends System {
  public components: Set<Function> = new Set([
    Guideline,
    LineMesh,
    ImpactPointMesh,
  ]);

  private lastKey?: BigInt;

  public run(ecs: ECS<any, unknown>, entity: Entity): void {
    // todo: resource
    const { physicsGuidelines } = settings;

    const [guideline, line, { ring, material: ringMaterial }] = ecs.get(
      entity,
      Guideline,
      LineMesh,
      ImpactPointMesh
    );

    const system = ecs.resource(SystemState);

    if (
      !system.isShootable ||
      (guideline.trackingPoints.length === 0 && !guideline.computing) ||
      ecs.query().resolveFirst(Cue).shooting
    ) {
      line.mesh.visible = false;
      ring.visible = false;
      return;
    }

    if (guideline.trackingPoints.length === 0) {
      return;
    }

    // remove tracking points inside ball / collision point
    const first = guideline.trackingPoints[0].position;
    const last = guideline.trackingPoints.at(-1)!.position;
    const innerTrackingPoints = guideline.trackingPoints.filter(
      (tp) =>
        vec.dist(tp.position, first) >= system.params.ball.radius &&
        vec.dist(tp.position, last) >= system.params.ball.radius
    );

    // always update the line mesh to ensure it billboards
    LineMesh.update(
      line,
      innerTrackingPoints.map((tp) => tp.position),
      physicsGuidelines
        ? innerTrackingPoints.map((tp) => getColor(tp.state))
        : undefined
    );

    if (guideline.key === this.lastKey) {
      return;
    }

    CONSOLE_TIME && console.time('guideline-draw');

    this.lastKey = guideline.key;

    line.mesh.visible = true;

    assert(guideline.collisionPoint);

    // ring
    ring.position.copy(toVector3(guideline.collisionPoint.position));
    ringMaterial.color = guideline.invalid
      ? new Color(0xff0000)
      : new Color(0xffffff);
    ring.visible = true;

    CONSOLE_TIME && console.timeEnd('guideline-draw');
  }
}
