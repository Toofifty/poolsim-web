import { Game } from '../game';
import type { Ball } from '../objects/ball';
import { properties } from '../physics/properties';
import type { Shot } from '../physics/shot';
import { AimAssistMode, settings } from '../store/settings';
import { Simulation, type ISimulation } from './simulation';
import type { TableState } from './table-state';
import { ThreadedSimulation } from './threaded-simulation';

export class AimAssist {
  private simulation: ISimulation = properties.useWorkerForAimAssist
    ? new ThreadedSimulation()
    : new Simulation();
  private profiler = Game.profiler;
  private lastShotKey: bigint = 0n;
  private balls: Ball[] = [];
  private ballMap: Map<number, Ball> = new Map();

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
    });
  }

  public async update(shot: Shot, state: TableState) {
    if (this.lastShotKey === shot.key) {
      return;
    }

    const firstContact = settings.aimAssistMode === AimAssistMode.FirstContact;

    await this.profiler.profile('aim-update', async () => {
      this.clear();
      this.lastShotKey = shot.key;

      const result = await this.simulation.run({
        shot,
        state,
        profiler: this.profiler,
        stopAtFirstContact: firstContact,
      });

      const hasFoul = result.hasFoul();

      result.collisions.forEach((collision, i) => {
        const initiator = this.ballMap.get(collision.initiator.id)!;
        initiator.addCollisionPoint(
          collision.snapshots.initiator.position,
          collision.snapshots.initiator.orientation
        );
        if (
          firstContact &&
          i === 0 &&
          (!hasFoul || collision.type === 'ball-cushion')
        ) {
          initiator.updateImpactArrow(
            collision.snapshots.initiator.position,
            collision.snapshots.initiator.velocity
          );
        }

        if (collision.type === 'ball-ball') {
          const other = this.ballMap.get(collision.other.id)!;
          other.addCollisionPoint(
            collision.snapshots.other.position,
            collision.snapshots.other.orientation
          );
          if (firstContact && i === 0 && !hasFoul) {
            other.updateImpactArrow(
              collision.snapshots.other.position,
              collision.snapshots.other.velocity
            );
          }
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
    this.profiler.dump();
  }
}
