import { AimAssistMode } from '../../../common/simulation/physics';
import { properties } from '../../../common/simulation/physics/properties';
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
  private simulation: ISimulation = properties.useWorkerForAimAssist
    ? new ThreadedSimulation()
    : new Simulation();
  private lastShotKey: bigint = 0n;
  private balls: Ball[] = [];
  private ballMap: Map<number, Ball> = new Map();

  constructor(public mode: AimAssistMode) {}

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
        const initiator = this.ballMap.get(collision.initiator.id)!;
        initiator.addCollisionPoint(
          collision.snapshots.initiator.position,
          collision.snapshots.initiator.orientation
        );
        if (hasFoul && collision.type !== 'ball-cushion') {
          initiator.invalidCollision = true;
        }

        if (collision.type === 'ball-ball') {
          const other = this.ballMap.get(collision.other.id)!;
          other.addCollisionPoint(
            collision.snapshots.other.position,
            collision.snapshots.other.orientation
          );
        }
      });

      // add tracking points
      result.trackingPoints.forEach(({ id, snapshot }) => {
        this.ballMap
          .get(id)!
          .addTrackingPoint(snapshot.position, snapshot.state);
      });

      // add final resting positions
      result.state?.balls.forEach((ball) => {
        const { position, orientation, state } = ball.snapshot();
        this.ballMap.get(ball.id)!.addCollisionPoint(position, orientation);
        this.ballMap.get(ball.id)!.addTrackingPoint(position, state);
      });
    });
    profiler?.dump();
  }
}
