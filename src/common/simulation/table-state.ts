import type { PhysicsBall } from './physics/ball';
import type { PhysicsCushion } from './physics/cushion';
import type { PhysicsPocket } from './physics/pocket';

export enum RuleSet {
  _8Ball,
  _9Ball,
  Debug,
}

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

    return this.balls.every((ball) => ball.id === -1 || ball.isPocketed);
  }

  public get lowestActiveBallId() {
    const activeIds: number[] = [];
    for (let i = 1; i < this.balls.length; i++) {
      const ball = this.balls[i];
      if (!ball.isPocketed) activeIds.push(ball.id);
    }
    return Math.min(...activeIds);
  }

  public get is8Ball() {
    return this.ruleSet === RuleSet._8Ball;
  }

  public get is9Ball() {
    return this.ruleSet === RuleSet._9Ball;
  }

  public hasOutOfBoundsBall() {
    return this.balls.some((ball) => ball.isOutOfBounds);
  }
}
