import { iteration, pairs } from '../util/iterate';
import {
  BallState,
  RuleSet,
  type PhysicsBall,
  type PhysicsCushion,
  type PhysicsPocket,
  type SerializedPhysicsBall,
  type SerializedPhysicsCushion,
  type SerializedPhysicsPocket,
} from './physics';

export enum EightBallState {
  Open,
  Player1Solids,
  Player1Stripes,
}

export enum Player {
  One,
  Two,
}

export type SerializedTableState = {
  balls: SerializedPhysicsBall[];
  ruleSet: RuleSet;
  isBreak: boolean;
  currentPlayer: Player;
  eightBallState: EightBallState;
};
export type FullSerializedTableState = SerializedTableState & {
  cushions: SerializedPhysicsCushion[];
  pockets: SerializedPhysicsPocket[];
};

/**
 * Table state used for simulations
 */
export class TableState {
  /**
   * Expected [cueBall, ...targetBalls]
   * Target balls are unordered
   */
  public balls: PhysicsBall[] = [];
  public cushions: PhysicsCushion[] = [];
  public pockets: PhysicsPocket[] = [];
  public ruleSet: RuleSet = RuleSet._9Ball;
  public eightBallState = EightBallState.Open;
  public isBreak: boolean;

  public needsUpdate = true;
  private _activeBalls: PhysicsBall[] = [];
  private _activePairs: [PhysicsBall, PhysicsBall][] = [];
  private _activeBallCushions: [PhysicsBall, PhysicsCushion][] = [];
  private _activeBallPockets: [PhysicsBall, PhysicsPocket][] = [];

  /**
   * Unlike play state, this is specifically NOT
   * inverted on non-hosts, and is also used the
   * same for local (or vs AI) games
   */
  public currentPlayer: Player = Player.One;

  constructor(
    balls: PhysicsBall[],
    cushions: PhysicsCushion[],
    pockets: PhysicsPocket[],
    ruleSet: RuleSet,
    isBreak = true,
    eightBallState: EightBallState = EightBallState.Open,
    currentPlayer: Player = Player.One
  ) {
    this.balls = balls;
    this.cushions = cushions;
    this.pockets = pockets;
    this.ruleSet = ruleSet;
    this.isBreak = isBreak;
    this.eightBallState = isBreak ? EightBallState.Open : eightBallState;
    this.currentPlayer = currentPlayer;
  }

  public reset() {
    this.isBreak = true;
    this.eightBallState = EightBallState.Open;
    this.needsUpdate = true;
  }

  public clone() {
    return new TableState(
      this.balls.map((ball) => ball.clone()),
      this.cushions,
      this.pockets,
      this.ruleSet,
      this.isBreak,
      this.eightBallState,
      this.currentPlayer
    );
  }

  public get cueBall() {
    return this.balls[0];
  }

  private refresh() {
    this._activeBalls = this.balls.filter(
      (ball) =>
        !ball.isPocketed &&
        !ball.isOutOfBounds &&
        ball.state !== BallState.OutOfPlay
    );
    this._activePairs = pairs(this._activeBalls);
    this._activeBallCushions = iteration(this._activeBalls, this.cushions);
    this._activeBallPockets = iteration(this._activeBalls, this.pockets);

    this.needsUpdate = false;
  }

  public get activeBalls() {
    if (this.needsUpdate) this.refresh();
    return this._activeBalls;
  }

  public get activePairs() {
    if (this.needsUpdate) this.refresh();
    return this._activePairs;
  }

  public get activeBallCushions() {
    if (this.needsUpdate) this.refresh();
    return this._activeBallCushions;
  }

  public get activeBallPockets() {
    if (this.needsUpdate) this.refresh();
    return this._activeBallPockets;
  }

  public get settled() {
    return this.balls.every(
      (ball) =>
        ball.isStationary || ball.isPocketedStationary || ball.isOutOfBounds
    );
  }

  public get isGameOver() {
    if (this.ruleSet === RuleSet._8Ball || this.ruleSet === RuleSet._9Ball) {
      // 5th ball is 8 or 9 ball
      return this.balls[5].isPocketed;
    }

    return this.balls.every((ball) => ball.id === 0 || ball.isPocketed);
  }

  public get lowestActiveBallId() {
    const activeIds: number[] = [];
    for (let i = 1; i < this.balls.length; i++) {
      const ball = this.balls[i];
      if (!ball.isPocketed && ball.state !== BallState.OutOfPlay)
        activeIds.push(ball.id);
    }
    return Math.min(...activeIds);
  }

  private getBallIds(indices: number[]) {
    return indices.map((i) => this.balls[i]?.id);
  }

  private get activeSolidBalls() {
    return this.activeBalls.filter((ball) => ball.id !== 0 && ball.id < 8);
  }

  private get activeStripeBalls() {
    return this.activeBalls.filter((ball) => ball.id !== 0 && ball.id > 8);
  }

  public getTargetableBalls(): Set<number> {
    if (
      this.ruleSet === RuleSet._9Ball ||
      this.ruleSet === RuleSet.SandboxSequential
    ) {
      return new Set([this.lowestActiveBallId]);
    }

    if (this.ruleSet === RuleSet._8Ball) {
      if (this.isBreak) {
        // allowed to hit only first 2 rows on break
        return new Set(this.getBallIds([1, 2, 3]));
      }

      if (this.eightBallState === EightBallState.Open) {
        return new Set(
          this.balls
            .map((ball) => {
              if (ball.isPocketed || ball.isOutOfBounds) return undefined;
              if (ball.id === 0 || ball.id === 8) return undefined;
              return ball.id;
            })
            .filter((v) => v !== undefined)
        );
      }

      if (
        (this.currentPlayer === Player.One) ===
        (this.eightBallState === EightBallState.Player1Solids)
      ) {
        // solids
        const balls = this.activeSolidBalls;
        return balls.length > 0
          ? new Set(balls.map((ball) => ball.id))
          : new Set([8]);
      }

      if (
        (this.currentPlayer === Player.One) ===
        (this.eightBallState === EightBallState.Player1Stripes)
      ) {
        // stripes
        const balls = this.activeStripeBalls;
        return balls.length > 0
          ? new Set(balls.map((ball) => ball.id))
          : new Set([8]);
      }
    }

    return new Set(
      this.activeBalls.filter((ball) => ball.id !== 0).map((ball) => ball.id)
    );
  }

  public hasOutOfBoundsBall() {
    return this.balls.some(
      (ball) =>
        ball.isOutOfBounds &&
        ball.state !== BallState.OutOfPlay &&
        !ball.isPocketed
    );
  }

  public serialize() {
    return {
      ruleSet: this.ruleSet,
      isBreak: this.isBreak,
      balls: this.balls.map((b) => b.serialize()),
      eightBallState: this.eightBallState,
      currentPlayer: this.currentPlayer,
    } satisfies SerializedTableState;
  }

  public serializeFull() {
    return {
      ...this.serialize(),
      cushions: this.cushions.map((c) => c.serialize()),
      pockets: this.pockets.map((p) => p.serialize()),
    } satisfies FullSerializedTableState;
  }

  public sync(state: SerializedTableState) {
    this.ruleSet = state.ruleSet;
    this.isBreak = state.isBreak;
    this.balls.forEach((ball, i) => {
      ball.sync(state.balls[i], this.pockets);
    });
    this.eightBallState = state.eightBallState;
    this.currentPlayer = state.currentPlayer;
    this.needsUpdate = true;
  }

  public syncFull(state: FullSerializedTableState) {
    this.cushions.forEach((cushion, i) => {
      cushion.sync(state.cushions[i]);
    });
    this.pockets.forEach((pocket, i) => {
      pocket.sync(state.pockets[i]);
    });
    this.sync(state);
  }
}
