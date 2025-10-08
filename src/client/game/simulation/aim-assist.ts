import { vec } from '../../../common/math';
import {
  AimAssistMode,
  type Params,
  type PhysicsBallSnapshot,
} from '../../../common/simulation/physics';
import type { Result } from '../../../common/simulation/result';
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

const CONSOLE_TIME = false;

export class AimAssist {
  private simulation: ISimulation;
  private lastShotKey: bigint = 0n;
  private balls: Ball[] = [];
  private ballMap: Map<number, Ball> = new Map();

  private calculating = false;

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

  public clear(keepShotKey = false) {
    if (this.lastShotKey === 0n) return;
    if (!keepShotKey) this.lastShotKey = 0n;
    this.balls.forEach((ball) => {
      ball.clearCollisionPoints();
      ball.clearImpactArrows();
      ball.invalidCollision = false;
    });
  }

  private updateFirstContactOverlay(result: Result) {
    const fn =
      this.mode === AimAssistMode.FirstContact
        ? 'updateImpactArrow'
        : 'updateCurvedImpactArrow';

    const hasFoul = result.hasFoul();
    // first cue ball collision
    const firstCollision = result.collisions.find(
      (collision) =>
        collision.initiator.id === 0 &&
        (collision.type === 'ball-ball' || collision.type === 'ball-cushion')
    );
    if (
      firstCollision &&
      (!hasFoul || firstCollision.type === 'ball-cushion')
    ) {
      this.ballMap
        .get(firstCollision.initiator.id)!
        [fn](
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
  }

  private updateFirstBallContactOverlay(result: Result) {
    const fn =
      this.mode === AimAssistMode.FirstBallContact
        ? 'updateImpactArrow'
        : 'updateCurvedImpactArrow';

    const hasFoul = result.hasFoul();
    const firstCollision = result.collisions.find(
      (collision) => collision.type === 'ball-ball'
    );
    if (firstCollision && !hasFoul) {
      this.ballMap
        .get(firstCollision.initiator.id)!
        [fn](
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

  private updateCollisionPoints(
    result: Result,
    firstContact: boolean,
    firstBallContact: boolean,
    initialSnapshots: PhysicsBallSnapshot[]
  ) {
    const hasFoul = result.hasFoul();

    result.collisions.forEach((collision) => {
      if (collision.initiator.id !== 0 && (firstContact || firstBallContact)) {
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

      if (i === 0 && firstBallContact) {
        this.ballMap.get(ball.id)!.invalidCollision = hasFoul;
      }
    });
  }

  public async update(shot: Shot, state: TableState) {
    if (
      this.calculating ||
      this.lastShotKey === shot.key ||
      this.mode === AimAssistMode.Off
    ) {
      return;
    }
    this.calculating = true;
    this.lastShotKey = shot.key;

    const firstContact =
      this.mode === AimAssistMode.FirstContact ||
      this.mode === AimAssistMode.FirstContactCurve;
    const firstBallContact =
      this.mode === AimAssistMode.FirstBallContact ||
      this.mode === AimAssistMode.FirstBallContactCurve;
    const profiler = settings.enableProfiler ? Game.profiler : undefined;
    const localProfiler = profiler ?? Profiler.none;
    const initialSnapshots = state.balls.map((ball) => ball.snapshot());

    const end = localProfiler.start('aim');

    if (CONSOLE_TIME) console.time('aim-assist');
    const result = await this.simulation.run({
      shot,
      state,
      trackPath: true,
      profiler,
      stopAtFirstContact: firstContact,
      stopAtFirstBallContact: firstBallContact,
      cueBallRollDist:
        this.mode === AimAssistMode.FirstContactCurve ||
        this.mode === AimAssistMode.FirstBallContactCurve
          ? this.params.simulation.cueBallRollDist
          : undefined,
    });

    localProfiler.profile('clear', () => this.clear(true));

    if (firstContact) {
      localProfiler.profile('first-contact', () =>
        this.updateFirstContactOverlay(result)
      );
    } else if (firstBallContact) {
      localProfiler.profile('first-ball-contact', () =>
        this.updateFirstBallContactOverlay(result)
      );
    }

    localProfiler.profile('collision-points', () =>
      this.updateCollisionPoints(
        result,
        firstContact,
        firstBallContact,
        initialSnapshots
      )
    );

    localProfiler.profile('tracking-points', () => {
      // add tracking points
      for (const [ballId, trackingPoints] of result.trackingPointMap) {
        if (trackingPoints.length > 1) {
          this.ballMap.get(ballId)!.addTrackingPoints(trackingPoints);
        }
      }
    });

    this.calculating = false;
    if (CONSOLE_TIME) console.timeEnd('aim-assist');

    end();
    profiler?.dump();
  }
}
