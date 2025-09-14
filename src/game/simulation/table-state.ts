import type { Ball } from '../objects/ball';

export class TableState {
  public cueBall!: Ball;
  public targetBalls: Ball[] = [];

  public clone() {
    const newState = new TableState();
    newState.cueBall = this.cueBall.clone();
    newState.targetBalls = this.targetBalls.map((ball) => ball.clone());
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

  public get settled() {
    return this.targetBalls.every(
      (ball) => ball.isStationary || (ball.isPocketed && ball.number > 0)
    );
  }
}
