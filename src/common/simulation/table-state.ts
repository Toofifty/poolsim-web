import {
  RuleSet,
  type PhysicsBall,
  type PhysicsCushion,
  type PhysicsPocket,
  type SerializedPhysicsBall,
  type SerializedPhysicsCushion,
  type SerializedPhysicsPocket,
} from './physics';

export type SerializedTableState = {
  balls: SerializedPhysicsBall[];
  ruleSet: RuleSet;
  isBreak: boolean;
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
  public isBreak: boolean;

  constructor(
    balls: PhysicsBall[],
    cushions: PhysicsCushion[],
    pockets: PhysicsPocket[],
    ruleSet: RuleSet,
    isBreak = true
  ) {
    this.balls = balls;
    this.cushions = cushions;
    this.pockets = pockets;
    this.ruleSet = ruleSet;
    this.isBreak = isBreak;
  }

  public clone() {
    return new TableState(
      this.balls.map((ball) => ball.clone()),
      this.cushions,
      this.pockets,
      this.ruleSet,
      this.isBreak
    );
  }

  public get cueBall() {
    return this.balls[0];
  }

  public get activeBalls() {
    // todo: optimise (filter/new array may be slow)
    return this.balls.filter((ball) => !ball.isPocketed);
  }

  public get settled() {
    return this.balls.every(
      (ball) => ball.isStationary || ball.isPocketedStationary
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

  public get targetableBalls() {
    if (this.ruleSet === RuleSet._9Ball) {
      return new Set([this.lowestActiveBallId]);
    }

    return new Set();
  }

  public get is8Ball() {
    return this.ruleSet === RuleSet._8Ball;
  }

  public get is9Ball() {
    return this.ruleSet === RuleSet._9Ball;
  }

  public hasOutOfBoundsBall() {
    return this.balls.some((ball) => ball.isOutOfBounds && !ball.isPocketed);
  }

  public serialize() {
    return {
      ruleSet: this.ruleSet,
      isBreak: this.isBreak,
      balls: this.balls.map((b) => b.serialize()),
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
