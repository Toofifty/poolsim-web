import { Game } from '../game';
import type { Ball } from '../objects/ball';
import { properties } from '../physics/properties';
import type { Shot } from '../physics/shot';
import { Simulation, type ISimulation } from './simulation';
import type { TableState } from './table-state';
import { ThreadedSimulation } from './threaded-simulation';

export class AimAssist {
  private simulation: ISimulation = properties.useWorkerForAimAssist
    ? new ThreadedSimulation()
    : new Simulation();
  private profiler = Game.profiler;
  private lastShotKey: number = 0;
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
    if (this.lastShotKey === 0) return;
    this.lastShotKey = 0;
    this.balls.forEach((ball) => ball.clearCollisionPoints());
  }

  public async update(shot: Shot, state: TableState) {
    if (Math.abs(this.lastShotKey - shot.key) < properties.epsilon) {
      return;
    }

    await this.profiler.profile('aim-update', async () => {
      this.clear();

      const result = await this.simulation.run({
        shot,
        state,
        profiler: this.profiler,
      });

      result.collisions.forEach((collision) => {
        const initiator = this.ballMap.get(collision.initiator.id)!;
        initiator.addCollisionPoint(
          collision.snapshots.initiator.position,
          collision.snapshots.initiator.orientation
        );
        if (collision.type === 'ball-ball') {
          const other = this.ballMap.get(collision.other.id)!;
          other.addCollisionPoint(
            collision.snapshots.other.position,
            collision.snapshots.other.orientation
          );
        }
      });

      // add final resting positions
      result.state?.balls.forEach((ball) => {
        const { position, orientation } = ball.getSnapshot();
        this.ballMap.get(ball.id)!.addCollisionPoint(position, orientation);
      });

      this.lastShotKey = shot.key;
    });
    this.profiler.dump();
  }
}
