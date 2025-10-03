import {
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

  /**
   * Unlike play state, this is specifically NOT
   * inverted on non-hosts, and is also used the
   * same for local (or vs AI) games
   */
  public currentPlayer: Player;

  constructor(
    balls: PhysicsBall[],
    cushions: PhysicsCushion[],
    pockets: PhysicsPocket[],
    ruleSet: RuleSet,
    isBreak = true,
    eightBallState: EightBallState = EightBallState.Open
  ) {
    this.currentPlayer = Math.random() > 0.5 ? Player.One : Player.Two;
    this.balls = balls;
    this.cushions = cushions;
    this.pockets = pockets;
    this.ruleSet = ruleSet;
    this.isBreak = isBreak;
    this.eightBallState = isBreak ? EightBallState.Open : eightBallState;
  }

  public reset() {
    this.isBreak = true;
    this.eightBallState = EightBallState.Open;
  }

  public clone() {
    return new TableState(
      this.balls.map((ball) => ball.clone()),
      this.cushions,
      this.pockets,
      this.ruleSet,
      this.isBreak,
      this.eightBallState
    );
  }

  public get cueBall() {
    return this.balls[0];
  }

  public get activeBalls() {
    // todo: optimise (filter/new array may be slow)
    return this.balls.filter((ball) => !ball.isPocketed && !ball.isOutOfBounds);
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
      if (!ball.isPocketed) activeIds.push(ball.id);
    }
    return Math.min(...activeIds);
  }

  private getBallIds(indices: number[]) {
    return indices.map((i) => this.balls[i]?.id);
  }

  public getTargetableBalls(): Set<number> {
    if (this.ruleSet === RuleSet._9Ball) {
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
    }

    return new Set();
  }

  public hasOutOfBoundsBall() {
    return this.balls.some((ball) => ball.isOutOfBounds && !ball.isPocketed);
  }

  public serialize() {
    return {
      ruleSet: this.ruleSet,
      isBreak: this.isBreak,
      balls: this.balls.map((b) => b.serialize()),
      eightBallState: this.eightBallState,
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
