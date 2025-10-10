import { ECS, EventSystem } from '@common/ecs';
import { vec } from '@common/math';
import { defaultParams } from '@common/simulation/physics';
import { Physics, PhysicsState } from '../components/physics';
import { PlayState } from '../controller/game-controller';
import type { GameEvents } from '../events';
import { SystemState } from '../resources/system-state';

export class BallShootSystem extends EventSystem<'game/shoot', GameEvents> {
  public event = 'game/shoot' as const;

  public run(
    ecs: ECS<GameEvents, unknown>,
    { targetEntity, shot }: GameEvents['game/shoot']
  ): void {
    const [ball] = ecs.get(targetEntity, Physics);

    let direction = vec.norm(shot.velocity);
    if (shot.lift > 0) {
      const right = vec.norm(vec.cross(vec.UP, direction));
      direction = vec.norm(vec.rotate(direction, right, shot.lift));
    }

    const I = 0.4 * ball.R * ball.R;

    const right = vec.norm(vec.cross(vec.UP, direction));
    const up = vec.norm(vec.cross(direction, right));

    // apply spins
    if (Math.abs(shot.topSpin) > 0) {
      const r = vec.mult(
        up,
        shot.topSpin * defaultParams.ball.spinMultiplier * ball.R
      );
      const dw = vec.mult(vec.cross(r, direction), 1 / I);
      vec.madd(ball.w, dw);
    }

    if (Math.abs(shot.sideSpin) > 0) {
      const r = vec.mult(
        right,
        shot.sideSpin * defaultParams.ball.spinMultiplier * ball.R
      );
      const dw = vec.mult(vec.cross(r, direction), 1 / I);
      vec.madd(ball.w, dw);
    }

    const dv = vec.mult(direction, vec.len(shot.velocity));
    // contribute less to vertical velocity based on where the cue ball is hit
    dv[2] *= Math.cos((shot.sideSpin * Math.PI) / 2);
    vec.madd(ball.v, dv);

    ball.state = PhysicsState.Sliding;
    const systemState = ecs.resource(SystemState);
    systemState.playState = PlayState.PlayerInPlay;
  }
}
