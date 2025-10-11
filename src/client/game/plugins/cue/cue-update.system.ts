import { ECS, System, type Entity } from '@common/ecs';
import { defaultParams } from '@common/simulation/physics';
import { Vector3 } from 'three';
import { toVector3 } from '../../util/three-interop';
import { CueMesh } from './cue-mesh.component';
import { Cue } from './cue.component';

const LEFT = new Vector3(1, 0, 0);

export class CueUpdateSystem extends System {
  public components: Set<Function> = new Set([Cue, CueMesh]);

  public run(ecs: ECS<any, unknown>, entity: Entity): void {
    const [cue, mesh] = ecs.get(entity, Cue, CueMesh);
    mesh.mesh.position.copy(toVector3(cue.target));
    mesh.mesh.rotation.z = cue.angle - Math.PI / 2;
    mesh.cue.position.y =
      -(defaultParams.cue.length / 2 + defaultParams.ball.radius * 1.5) -
      cue.drawback;

    // spins
    mesh.cue.position.x = -cue.side * defaultParams.ball.radius;
    mesh.cue.position.z = cue.top * defaultParams.ball.radius;
    mesh.lift.setRotationFromAxisAngle(LEFT, -Math.PI / 48 - cue.lift);

    // draw-back during shot
  }
}
