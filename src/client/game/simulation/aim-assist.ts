import { vec } from '../../../common/math';
import { AimAssistMode, type Params } from '../../../common/simulation/physics';
import type { Shot } from '../../../common/simulation/shot';
import {
  Simulation,
  type ISimulation,
} from '../../../common/simulation/simulation';
import type { TableState } from '../../../common/simulation/table-state';
import { Profiler } from '../../../common/util/profiler';
import { Game } from '../game';
import type { Ball } from '../objects/ball';
import { settings } from '../store/settings';
import { ThreadedSimulation } from './threaded-simulation';

export class AimAssist {
  private simulation: ISimulation;
  private lastShotKey: bigint = 0n;
  private balls: Ball[] = [];
  private ballMap: Map<number, Ball> = new Map();

  constructor(private params: Params) {
    this.simulation = params.simulation.useWorkerForAimAssist
      ? new ThreadedSimulation()
      : new Simulation(params);
  }

  get mode() {
    return this.params.game.aimAssist;
  }

  public setBalls(balls: Ball[]) {
    this.clear();
    this.balls = balls;
    this.balls.forEach((ball) => {
      this.ballMap.set(ball.id, ball);
    });
  }

  public clear() {
    if (this.lastShotKey === 0n) return;
    this.lastShotKey = 0n;
    this.balls.forEach((ball) => {
      ball.clearCollisionPoints();
      ball.clearImpactArrow();
      ball.invalidCollision = false;
    });
  }

  public async update(shot: Shot, state: TableState) {
    if (this.lastShotKey === shot.key || this.mode === AimAssistMode.Off) {
      return;
    }

    const firstContact = this.mode === AimAssistMode.FirstContact;
    const firstBallContact = this.mode === AimAssistMode.FirstBallContact;
    const profiler = settings.enableProfiler ? Game.profiler : undefined;
    const initialSnapshots = state.balls.map((ball) => ball.snapshot());

    await (profiler ?? Profiler.none).profile('aim-update', async () => {
      this.clear();
      this.lastShotKey = shot.key;

      const result = await this.simulation.run({
        shot,
        state,
        trackPath: true,
        profiler,
        stopAtFirstContact: firstContact,
        stopAtFirstBallContact: firstBallContact,
      });

      const hasFoul = result.hasFoul();

      if (firstContact) {
        const firstCollision = result.collisions.find(
          (collision) =>
            collision.type === 'ball-ball' || collision.type === 'ball-cushion'
        );
        if (
          firstCollision &&
          (!hasFoul || firstCollision.type === 'ball-cushion')
        ) {
          this.ballMap
            .get(firstCollision.initiator.id)!
            .updateImpactArrow(
              firstCollision.snapshots.initiator.position,
              firstCollision.snapshots.initiator.velocity
            );

          if (firstCollision.type === 'ball-ball') {
            this.ballMap
              .get(firstCollision.other.id)!
              .updateImpactArrow(
                firstCollision.snapshots.other.position,
                firstCollision.snapshots.other.velocity
              );
          }
        }
      } else if (firstBallContact) {
        const firstCollision = result.collisions.find(
          (collision) => collision.type === 'ball-ball'
        );
        if (firstCollision && !hasFoul) {
          this.ballMap
            .get(firstCollision.initiator.id)!
            .updateImpactArrow(
              firstCollision.snapshots.initiator.position,
              firstCollision.snapshots.initiator.velocity
            );

          this.ballMap
            .get(firstCollision.other.id)!
            .updateImpactArrow(
              firstCollision.snapshots.other.position,
              firstCollision.snapshots.other.velocity
            );
        }
      }

      result.collisions.forEach((collision, i) => {
        if (
          collision.initiator.id !== 0 &&
          (firstContact || firstBallContact)
        ) {
          // do not add collisions for target balls
          return;
        }

        const initiator = this.ballMap.get(collision.initiator.id)!;
        if (!firstBallContact || collision.type !== 'ball-cushion') {
          initiator.addCollisionPoint(
            collision.snapshots.initiator.position,
            collision.snapshots.initiator.orientation
          );
        }

        if (hasFoul && collision.type !== 'ball-cushion') {
          initiator.invalidCollision = true;
        }

        if (
          collision.type === 'ball-ball' &&
          !firstContact &&
          !firstBallContact
        ) {
          const other = this.ballMap.get(collision.other.id)!;
          other.addCollisionPoint(
            collision.snapshots.other.position,
            collision.snapshots.other.orientation
          );
        }
      });

      // add tracking points
      for (const [ballId, trackingPoints] of result.trackingPointMap) {
        if (trackingPoints.length > 1) {
          this.ballMap.get(ballId)!.addTrackingPoints(trackingPoints);
        }
      }

      // add final resting positions
      result.state?.balls.forEach((ball, i) => {
        if (i !== 0 && (firstContact || firstBallContact)) {
          // do not add resting positions for target balls
          return;
        }

        const initial = initialSnapshots[i];
        const snapshot = ball.snapshot();
        if (!vec.eq(initial.position, snapshot.position, 1e-3)) {
          this.ballMap
            .get(ball.id)!
            .addCollisionPoint(snapshot.position, snapshot.orientation);
        }
      });
    });
    profiler?.dump();
  }
}
