import type { PhysicsBall } from '../physics/ball';
import type { PhysicsCushion } from '../physics/cushion';
import type { PhysicsPocket } from '../physics/pocket';

export enum RuleSet {
  _8Ball,
  _9Ball,
}

export type SerializedTableState = {};

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

  constructor(
    balls: PhysicsBall[],
    cushions: PhysicsCushion[],
    pockets: PhysicsPocket[],
    ruleSet: RuleSet
  ) {
    this.balls = balls;
    this.cushions = cushions;
    this.pockets = pockets;
    this.ruleSet = ruleSet;
  }

  public clone() {
    return new TableState(
      this.balls.map((ball) => ball.clone()),
      this.cushions,
      this.pockets,
      this.ruleSet
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
    return this.balls.every((ball) => ball.isStationary);
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
}
