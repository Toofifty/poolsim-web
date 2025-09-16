import type { Ball } from '../objects/ball';

export enum RuleSet {
  _8Ball,
  _9Ball,
}

export class TableState {
  public cueBall!: Ball;
  public targetBalls: Ball[] = [];
  public ruleSet!: RuleSet;

  public clone() {
    const newState = new TableState();
    newState.cueBall = this.cueBall.clone();
    newState.targetBalls = this.targetBalls.map((ball) => ball.clone());
    newState.ruleSet = this.ruleSet;
    return newState;
  }

  public get balls() {
    if (!this.cueBall) {
      throw new Error('No cue ball found');
    }
    return [this.cueBall, ...this.targetBalls];
  }

  public get activeBalls() {
    return this.balls.filter((ball) => !ball.isPocketed);
  }

  public get lowestActiveBall() {
    return this.targetBalls.find((ball) => !ball.isPocketed);
  }

  public get settled() {
    return (
      this.cueBall.isStationary &&
      this.targetBalls.every((ball) => ball.isStationary)
    );
  }

  public get is8Ball() {
    return this.ruleSet === RuleSet._8Ball;
  }

  public get is9Ball() {
    return this.ruleSet === RuleSet._9Ball;
  }
}
