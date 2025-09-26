import type { PhysicsBall } from './ball';
import { properties } from './properties';
import { vec, type Vec } from '../../math';

export class PhysicsPocket {
  public position: Vec;
  public radius: number;
  public depth = properties.pocketDepth;
  public balls: PhysicsBall[] = [];

  constructor(x: number, y: number, z: number, radius: number) {
    this.position = vec.new(x, y, z - this.depth / 2);
    this.radius = radius;
  }

  public addBall(ball: PhysicsBall) {
    this.balls.push(ball);
  }

  public removeBall(ball: PhysicsBall) {
    this.balls = this.balls.filter((b) => b !== ball);
  }
}
