import { ECS, System, type Entity } from '@common/ecs';
import { assert } from '@common/util';
import { Color } from 'three';
import { PlayState } from '../../controller/game-controller';
import { SystemState } from '../../resources/system-state';
import { settings } from '../../store/settings';
import { toVector3 } from '../../util/three-interop';
import { PhysicsState } from '../physics/physics.component';
import { GuidelineMesh } from './guideline-mesh.component';
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

export class GuidelineUpdateSystem extends System {
  public components: Set<Function> = new Set([
    Guideline,
    GuidelineMesh,
    ImpactPointMesh,
  ]);

  private lastKey?: BigInt;

  public run(ecs: ECS<any, unknown>, entity: Entity): void {
    // todo: resource
    const { physicsGuidelines } = settings;

    // todo: check key

    const [guideline, { line, geometry }, { ring, material: ringMaterial }] =
      ecs.get(entity, Guideline, GuidelineMesh, ImpactPointMesh);

    const systemState = ecs.resource(SystemState);
    if (
      systemState.playState !== PlayState.PlayerShoot ||
      guideline.trackingPoints.length === 0
    ) {
      line.visible = false;
      ring.visible = false;
      return;
    }

    if (guideline.key === this.lastKey) {
      return;
    }
    this.lastKey = guideline.key;

    const positions: number[] = [];
    const colors: number[] = [];

    for (const point of guideline.trackingPoints) {
      positions.push(...point.position);
      const color = physicsGuidelines
        ? getColor(point.state)
        : new Color(0xffffff);
      colors.push(color.r, color.g, color.b);
    }

    // guideline
    geometry.setPositions(positions);
    geometry.setColors(colors);
    line.computeLineDistances();
    line.scale.set(1, 1, 1);
    line.visible = true;

    assert(guideline.collisionPoint);

    // ring
    ring.position.copy(toVector3(guideline.collisionPoint.position));
    ringMaterial.color = guideline.invalid
      ? new Color(0xff0000)
      : new Color(0xffffff);
    ring.visible = true;
  }
}
