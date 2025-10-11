import { Component } from '@common/ecs';
import type { Vec } from '@common/math';
import type { Color } from 'three';
import type { PhysicsSnapshot } from '../physics/physics.component';

export class Guideline extends Component {
  /** Shot key */
  public key?: BigInt;

  /** Points from cue ball to collision point */
  public trackingPoints: PhysicsSnapshot[] = [];
  /** Cue ball position at first collision */
  public collisionPoint?: PhysicsSnapshot;
  /** Whether shot is invalid */
  public invalid = false;

  public cueBallVelocity?: Vec;
  public targetBallVelocity?: Vec;
  public targetBallPosition?: Vec;
  public targetBallColor?: Color;

  public reset() {
    this.key = undefined;
    this.trackingPoints = [];
    this.collisionPoint = undefined;
    this.invalid = false;
    this.cueBallVelocity = undefined;
    this.targetBallVelocity = undefined;
    this.targetBallPosition = undefined;
    this.targetBallColor = undefined;
  }

  public static create() {
    return new Guideline();
  }
}
